import React, { Component } from 'react'
import getWeb3 from './getWeb3'
import KeysManager from './keysManager'
import PoaNetworkConsensus from './poaNetworkConsensus'
import Keys from './Keys'
import swal from 'sweetalert'
import './index/index.css'
import addressGenerator from './addressGenerator'
import JSzip from 'jszip'
import FileSaver from 'file-saver'
import { constants } from './constants'
import networkAddresses from './addresses'
import Header from './Header'
import Footer from './Footer'
import Loading from './Loading'

function generateElement(msg) {
  let errorNode = document.createElement('div')
  errorNode.innerHTML = `<div style="line-height: 1.6;">
    ${msg}
  </div>`
  return errorNode
}

class App extends Component {
  constructor(props) {
    super(props)
    this.onClick = this.onClick.bind(this)
    this.saveFile = blob => {
      FileSaver.saveAs(blob, `trustnode_keys.zip`)
    }
    this.state = {
      web3Config: {},
      mining: null,
      isDisabledBtn: props.generateKeysIsDisabled
    }
    this.keysManager = null
    this.poaNetworkConsensus = null
    getWeb3()
      .then(async web3Config => {
        return networkAddresses(web3Config)
      })
      .then(async config => {
        const { web3Config, addresses } = config
        this.keysManager = new KeysManager()
        await this.keysManager.init({
          web3: web3Config.web3Instance,
          netId: web3Config.netId,
          addresses
        })
        this.poaNetworkConsensus = new PoaNetworkConsensus()
        await this.poaNetworkConsensus.init({
          web3: web3Config.web3Instance,
          netId: web3Config.netId,
          addresses
        })
        this.setState({
          isDisabledBtn: false,
          web3Config
        })
      })
      .catch(error => {
        if (error.msg) {
          this.setState({ isDisabledBtn: true })
          swal({
            icon: 'warning',
            title: 'Warning',
            content: error.node
          })
        }
      })
  }
  componentDidMount() {}
  async generateKeys(cb) {
    const voting = await addressGenerator()
    const payout = await addressGenerator()
    this.setState({
      voting,
      payout,
      keysGenerated: true
    })
    return {
      voting,
      payout
    }
  }
  async generateZip({ voting, payout, netIdName }) {
    const zip = new JSzip()

    zip.file(`${netIdName}_keys/voting_key_${voting.jsonStore.address}.json`, JSON.stringify(voting.jsonStore))
    zip.file(`${netIdName}_keys/voting_password_${voting.jsonStore.address}.txt`, voting.password)

    zip.file(`${netIdName}_keys/payout_key_${payout.jsonStore.address}.json`, JSON.stringify(payout.jsonStore))
    zip.file(`${netIdName}_keys/payout_password_${payout.jsonStore.address}.txt`, payout.password)
    zip.generateAsync({ type: 'blob' }).then(blob => {
      FileSaver.saveAs(blob, `trustnode_keys.zip`)
    })
  }
  async onClick() {
    this.setState({ loading: true })

    this.state.miningAddr = ''
    if (window.location.hash.indexOf('0x') === 1) {
      console.log('has string after #')
      // TODO: check with web3.utils.isAddress()
      this.state.miningAddr = window.location.hash.substr(1)
    } else {
      this.setState({ loading: false })
      // TODO: don't hardcode the domain here
      const invalidAddrMsg = `The URL doesn't contain a valid address for the mining key<br/>
      Please put the address (with 0x prefix) after the # character.<br/>
      Example: https://ceremony.artis.network/#0x12345...`
      swal({
        icon: 'error',
        title: 'Error',
        content: generateElement(invalidAddrMsg)
      })
      return
    }

    const initialKey = this.state.web3Config.defaultAccount
    let isValid
    try {
      isValid = await this.keysManager.isInitialKeyValid(initialKey)
    } catch (e) {
      isValid = false
    }
    console.log(`valid initialKey: ${isValid}`)
    if (Number(isValid) !== 1) {
      this.setState({ loading: false })
      const invalidKeyMsg = `The key is an invalid Initial key<br/>
      or you're connected to the incorrect chain!<br/>
      Please make sure you have loaded correct Initial key in MetaMask.<br/><br/>
      <b>Your current selected key is</b> <i>${initialKey}</i><br/>
      <b>Current Network ID</b> is <i>${this.state.web3Config.netId}</i>`
      swal({
        icon: 'error',
        title: 'Error',
        content: generateElement(invalidKeyMsg)
      })
      return
    }
    if (Number(isValid) === 1) {
      const { voting, payout } = await this.generateKeys()
      const miningAddr = this.state.miningAddr

      // deposit for collateral
      // TODO: handle failure. As is, the second tx requests will warn that it will fail. But it's ugly
      await this.poaNetworkConsensus.depositCollateralFor(miningAddr, initialKey)

      console.log(`invoking createKeys(${miningAddr}, ${voting.jsonStore.address}, ${payout.jsonStore.address})`)
      // add loading screen
      await this.keysManager
        .createKeys({
          mining: miningAddr,
          voting: voting.jsonStore.address,
          payout: payout.jsonStore.address,
          sender: initialKey
        })
        .then(async receipt => {
          console.log(receipt)
          if (receipt.status === true || receipt.status === '0x1') {
            this.setState({ loading: false })
            swal('Congratulations!', 'Your keys are generated!', 'success')
            await this.generateZip({
              voting,
              payout,
              netIdName: this.state.web3Config.netIdName
            })
          } else {
            this.setState({ loading: false, keysGenerated: false })
            let content = document.createElement('div')
            let msg = `Transaction failed`
            content.innerHTML = `<div>
            Something went wrong!<br/><br/>
            Please contact Master Of Ceremony<br/><br/>
            ${msg}
          </div>`
            swal({
              icon: 'error',
              title: 'Error',
              content: content
            })
          }
        })
        .catch(error => {
          console.error(error.message)
          this.setState({ loading: false, keysGenerated: false })
          let content = document.createElement('div')
          let msg
          if (error.message.includes(constants.userDeniedTransactionPattern))
            msg = `Error: ${constants.userDeniedTransactionPattern}`
          else msg = error.message
          content.innerHTML = `<div>
          Something went wrong!<br/><br/>
          Please contact Master Of Ceremony<br/><br/>
          ${msg}
        </div>`
          swal({
            icon: 'error',
            title: 'Error',
            content: content
          })
        })
    }
  }
  render() {
    let loader = this.state.loading ? <Loading netId={this.state.web3Config.netId} /> : ''
    // TODO: format this in a way which preserves line breaks
    let createKeyBtn = (
      <div className="create-keys">
        <h1>Register trustnode keys</h1>
        <div className="center">
        <p>This application is for you if you received an <b>Initial Key</b> from the <b>Master of Ceremony</b>. <br /> <br /></p>
        <p> <b>IMPORTANT:</b> You need to create a mining key beforehand and deliver its address in the URL. Example:<br />
          https://ceremony.artis.network/#0x12345...<br /> <br /></p>
        <p> If an address is recognized, the button &quot;Register keys&quot; will become active.<br /> <br /></p>
        <p> Once you click that button, the following happens:<br /> </p>
        <ol>
          <li>the App checks if there's already enough deposits for collateral (associated to the mining key)</li>
          <li> if deposits are missing, the App tries to deposit missing funds from the initial key</li>
          <li> the App creates voting and payout keys</li>
          <li> the App registers the addresses of the 3 keys (mining, voting, payout) in a governance contract</li>
          <li> download (from the browser to a local file) of the voting and payout key is triggered</li>
        </ol>
        <p> Note: everything (including key generation) is done locally. The App is served from a server for convenience.<br />
          Somebody with Ethereum development expertise could do this operations without this App (e.g. via a web3 enabled console).</p>
        <p> In case you let this App make deposits for collateral, make sure you use the correct address for the mining key.<br />
          If you use an address you don't have the private key for, the deposit is lost.</p>
          </div>
        <div className="create-keys-button-container">
          <button className="create-keys-button" onClick={this.onClick} disabled={this.state.isDisabledBtn}>
            Register keys
          </button>
        </div>
      </div>
    )
    let content
    if (this.state.keysGenerated) {
      content = <Keys mining={this.state.mining} voting={this.state.voting} payout={this.state.payout} />
    } else {
      content = createKeyBtn
    }
    return (
      <div className="App">
        <Header netId={this.state.web3Config.netId} />
        {loader}
        <section className="content">{content}</section>
        <Footer netId={this.state.web3Config.netId} />
      </div>
    )
  }
}

export default App
