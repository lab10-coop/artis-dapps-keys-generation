import React, { Component } from 'react'
import Tooltip from 'rc-tooltip'
import 'rc-tooltip/assets/bootstrap.css'

const encodeJson = json => {
  const encoded = window.encodeURIComponent(JSON.stringify(json))
  return `data:application/json;charset=utf-8,${encoded}`
}

export default class Keys extends Component {
  constructor(props) {
    super(props)
    this.onVisibleChange = this.onVisibleChange.bind(this)
    this.onCopyBtnClick = this.onCopyBtnClick.bind(this)
    this.state = {
      copyBtns: {
        copyVotingPass: {
          visible: false,
          text: 'Copy'
        },
        copyPayoutPass: {
          visible: false,
          text: 'Copy'
        },
        copyVotingKey: {
          visible: false,
          text: 'Copy'
        },
        copyPayoutKey: {
          visible: false,
          text: 'Copy'
        }
      }
    }
  }
  componentWillUpdate(nextProps, nextState) {
    if (this.refs.payoutKeyAddress) {
      const Clipboard = require('clipboard')
      // this.clipboard = new Clipboard(this.refs.copyBtn);
      new Clipboard(this.refs.payoutKeyAddress)
      new Clipboard(this.refs.payoutKeyPass)
      new Clipboard(this.refs.votingKeyAddress)
      new Clipboard(this.refs.votingKeyPass)
    }
  }
  onVisibleChange(id) {
    console.log(id)
    let copyBtns = this.state.copyBtns
    copyBtns[id].visible = !copyBtns[id].visible
    copyBtns[id].text = 'Copy'
    this.setState({
      copyBtns
    })

    // const id = e.target.id;
  }
  onCopyBtnClick(e) {
    const id = e.target.id
    let copyBtns = this.state.copyBtns
    copyBtns[id].text = 'Copied!'
    this.setState({
      copyBtns
    })
  }
  render() {
    return (
      <div className="container">
        <div className="keys">
          <div className="keys-i">
            <p className="keys-title">Payout key</p>
            <div className="keys-hash-container">
              <p className="keys-hash" id="payoutKey">
                0x
                {this.props.payout.jsonStore.address}
              </p>
              <Tooltip
                visible={this.state.copyBtns.copyPayoutKey.visible}
                animation="zoom"
                trigger="hover"
                onVisibleChange={() => {
                  this.onVisibleChange('copyPayoutKey')
                }}
                placement="right"
                overlay={this.state.copyBtns.copyPayoutKey.text}
              >
                <span
                  id="copyPayoutKey"
                  onClick={this.onCopyBtnClick}
                  className="copy"
                  ref="payoutKeyAddress"
                  data-clipboard-text={'0x' + this.props.payout.jsonStore.address}
                />
              </Tooltip>
            </div>
            <p className="keys-hash">
              <label className="password-label">Password:</label>
              <input
                type="password"
                disabled={true}
                id="payoutKeyPass"
                className="pass"
                defaultValue={this.props.payout.password}
              />
              <Tooltip
                visible={this.state.copyBtns.copyPayoutPass.visible}
                animation="zoom"
                trigger="hover"
                onVisibleChange={() => {
                  this.onVisibleChange('copyPayoutPass')
                }}
                placement="right"
                overlay={this.state.copyBtns.copyPayoutPass.text}
              >
                <span
                  id="copyPayoutPass"
                  onClick={this.onCopyBtnClick}
                  className="copy"
                  ref="payoutKeyPass"
                  data-clipboard-text={this.props.payout.password}
                />
              </Tooltip>
            </p>
            <p className="keys-description">
              Download this key and use it on your client node/wallet to spend earned coins.
            </p>
            <div className="keys-footer">
              <a
                className="keys-download"
                id="payoutKeyDownload"
                href={encodeJson(this.props.payout.jsonStore)}
                download={`payout_${this.props.payout.jsonStore.address}.json`}
              >
                Download Payout Key
              </a>
            </div>
          </div>
          <div className="keys-i">
            <p className="keys-title">Voting key</p>
            <div className="keys-hash-container">
              <p className="keys-hash" id="votingKey">
                0x
                {this.props.voting.jsonStore.address}
              </p>
              <Tooltip
                visible={this.state.copyBtns.copyVotingKey.visible}
                animation="zoom"
                trigger="hover"
                onVisibleChange={() => {
                  this.onVisibleChange('copyVotingKey')
                }}
                placement="right"
                overlay={this.state.copyBtns.copyVotingKey.text}
              >
                <span
                  id="copyVotingKey"
                  onClick={this.onCopyBtnClick}
                  className="copy"
                  ref="votingKeyAddress"
                  data-clipboard-text={'0x' + this.props.voting.jsonStore.address}
                />
              </Tooltip>
            </div>
            <p className="keys-hash">
              <label className="password-label">Password:</label>
              <input
                type="password"
                disabled={true}
                id="votingKeyPass"
                className="pass"
                defaultValue={this.props.voting.password}
              />
              <Tooltip
                visible={this.state.copyBtns.copyVotingPass.visible}
                animation="zoom"
                trigger="hover"
                onVisibleChange={() => {
                  this.onVisibleChange('copyVotingPass')
                }}
                placement="right"
                overlay={this.state.copyBtns.copyVotingPass.text}
              >
                <span
                  id="copyVotingPass"
                  onClick={this.onCopyBtnClick}
                  className="copy"
                  ref="votingKeyPass"
                  data-clipboard-text={this.props.voting.password}
                />
              </Tooltip>
            </p>
            <p className="keys-description">
              Download this key and use it on your client node to vote for necessary ballots, such as adding or removing
              miners from the network.
            </p>
            <div className="keys-footer">
              <a
                className="keys-download"
                id="votingKeyDownload"
                href={encodeJson(this.props.voting.jsonStore)}
                download={`voting_${this.props.voting.jsonStore.address}.json`}
              >
                Download Voting Key
              </a>
            </div>
          </div>
        </div>
        <div className="keys-note">
          <p className="keys-note-title">Important</p>
          <p className="keys-note-description">
            Do not close this tab until you download all keys and save passwords. Keep keys secure and protected. If you
            lose your keys, you will need to get a new initial key using Voting DAPP.
          </p>
        </div>
      </div>
    )
  }
}
