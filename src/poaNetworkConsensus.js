import helpers from './helpers'
import { constants } from './constants'

export default class PoaNetworkConsensus {
  async init({ web3, netId, addresses }) {
    const { POA_ADDRESS } = addresses
    console.log('PoaNetworkConsensus ', POA_ADDRESS)

    const PoaNetworkConsensusAbi = await helpers.getABI(constants.NETWORKS[netId].BRANCH, 'PoaNetworkConsensus')

    this.instance = new web3.eth.Contract(PoaNetworkConsensusAbi, POA_ADDRESS)
    this.instance.options.gasPrice = 1000000000
    this.web3 = web3
    window.poa = this.instance
  }

  async currentDepositsOf(miningKey) {
    return await this.instance.methods.freeDeposits(miningKey).call()
  }

  /// checks existing deposits for miningKey, deposits missing amount
  /// TODO: behaviour when already enough deposits or sender without funds untested
  async depositCollateralFor(miningKey, sender) {
    const curDeposits = await this.currentDepositsOf(miningKey)
    const neededCollateral = await this.instance.methods.neededCollateral().call()

    const BN = this.web3.utils.BN
    const missingDepositsBN = new BN(neededCollateral).sub(new BN(curDeposits))
    console.log(`missing deposits: ${missingDepositsBN.toString()}`)
    // >= 0 ?
    if (missingDepositsBN.gte(0)) {
      console.log(`making deposit for collateral...`)

      return this.instance.methods.depositFor(miningKey).send({
        from: sender,
        value: missingDepositsBN
      })
    }
  }
}
