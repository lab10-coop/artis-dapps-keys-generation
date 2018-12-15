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

let web3

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
        web3 = web3Config.web3Instance
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
      Example: https://ceremony.artis.network/#0x12345...<br/>
      (if you already did, try to refresh)`
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
    if (Number(isValid) === 0) {
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
    } else if (Number(isValid) === 2) {
      this.setState({ loading: false })
      const invalidKeyMsg = `This initial key was already used`
      swal({
        icon: 'error',
        title: 'Error',
        content: generateElement(invalidKeyMsg)
      })
      return
    } else if (Number(isValid) !== 1) {
      this.setState({ loading: false })
      const invalidStateMsg = `Unknown state for initial key: ${Number(isValid)}`
      swal({
        icon: 'error',
        title: 'Error',
        content: generateElement(invalidStateMsg)
      })
      return
    }

    const miningAddr = this.state.miningAddr
    if (!web3.utils.isAddress(miningAddr)) {
      this.setState({ loading: false })
      const missingDeposits = `Given mining key is not a valid ARTIS address: ${miningAddr}`
      swal({
        icon: 'error',
        title: 'Error',
        content: generateElement(missingDeposits)
      })
      return
    }

    // check if needed deposits were made
    if (!(await this.poaNetworkConsensus.hasNeededDeposits(miningAddr))) {
      this.setState({ loading: false })
      const missingDeposits = `Required deposits for collateral are not in place for mining key ${miningAddr}`
      swal({
        icon: 'error',
        title: 'Error',
        content: generateElement(missingDeposits)
      })
      return
    }

    const { voting, payout } = await this.generateKeys()
    console.log(`voting: ${JSON.stringify(voting)}`)
    console.log(`payout: ${JSON.stringify(payout)}`)

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
          this.setState({ loading: false, keysGenerated: true })
          let content = document.createElement('div')
          let msg = `Transaction failed`
          content.innerHTML = `<div>
            Something may have gone wrong!<br/>
            Please do NOT close or refresh the page!<br/>
            Save the voting and payout keys and passwords!<br/>
            Contact the Master of Ceremony!<br/>
            <br/>
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
        if (error.message.includes(constants.userDeniedTransactionPattern)) {
          msg = `Error: ${constants.userDeniedTransactionPattern}`
          content.innerHTML = `<div>
            Transaction denied by user!<br/><br/>
            ${msg}
          </div>`
        } else {
          msg = error.message
          content.innerHTML = `<div>
            Something went wrong!<br/>
            Please do NOT close or refresh the page!<br/>
            Contact the Master of Ceremony!<br/>
            <br/>
            ${msg}
          </div>`
        }
        swal({
          icon: 'error',
          title: 'Error',
          content: content
        })
      })
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
          <p> If an address is recognized, the button &quot;REGISTER KEYS&quot; will become active.<br /> <br /></p>
          <p> Once you click that button, the following happens:<br /> </p>
          <ol>
            <li> check if the address provided via URL for the mining key is a valid Ethereum address</li>
            <li> check if there's enough deposits (4.5M ATS) for collateral associated to the mining key</li>
            <li> creation of voting and payout keys</li>
            <li> registration of the 3 addresses (mining, voting, payout) in a governance contract (triggers a transaction signing request)</li>
            <li> opening of a saving dialog for the two newly generated keys (in a zip file)</li>
          </ol>
          <p> Note: everything (including key generation) is done locally. The application is loaded from a webserver for convenience.<br />
          Somebody with Ethereum development expertise could do this operations without this application (e.g. via a web3 enabled console).</p>
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
