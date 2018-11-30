let constants = {}
constants.organization = 'poanetwork'
constants.repoName = 'poa-chain-spec'
constants.addressesSourceFile = 'contracts.json'
constants.ABIsSources = {
  KeysManager: 'KeysManager.abi.json',
  PoaNetworkConsensus: 'PoaNetworkConsensus.abi.json'
}
constants.userDeniedTransactionPattern = 'User denied transaction'

constants.NETWORKS = {
  '246529': {
    NAME: 'sigma1.artis',
    BRANCH: 'sigma1',
    TESTNET: false
  },
  '246785': {
    NAME: 'tau1.artis',
    BRANCH: 'tau1',
    TESTNET: true
  }
}

module.exports = {
  constants
}
