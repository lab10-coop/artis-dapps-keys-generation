let constants = {}
constants.organization = 'poanetwork'
constants.repoName = 'poa-chain-spec'
constants.addressesSourceFile = 'contracts.json'
constants.ABIsSources = {
  KeysManager: 'KeysManager.abi.json'
}
constants.userDeniedTransactionPattern = 'User denied transaction'

constants.NETWORKS = {
  '246529': {
    NAME: 'ARTIS Sigma 1',
    BRANCH: 'sigma1',
    TESTNET: false
  },
  '246785': {
    NAME: 'ARTIS Tau 1',
    BRANCH: 'tau1',
    TESTNET: true
  }
}

module.exports = {
  constants
}
