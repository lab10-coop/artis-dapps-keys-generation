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

  async neededCollateral() {
    return await this.instance.methods.neededCollateral().call()
  }

  async hasNeededDeposits(miningKey) {
    const curDeposits = await this.currentDepositsOf(miningKey)
    const neededCollateral = await this.neededCollateral()

    const BN = this.web3.utils.BN

    const curDepositsBN = new BN(curDeposits)
    const neededCollateralBN = new BN(neededCollateral)

    console.log(`curDep: ${curDeposits}, neededColl: ${neededCollateral}`)

    const ret = curDepositsBN.gte(neededCollateralBN)
    console.log(`ret is ${ret}`)

    // a.gte(b): a is greater than or equal b
    return curDepositsBN.gte(neededCollateralBN)
  }
}
