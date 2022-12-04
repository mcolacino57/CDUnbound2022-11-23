/**
 * Purpose: set the current proposal with only a proposal
 * name string; create a new propInst and dbInst to do so
 *
 * @param  {String} pnS - proposal name string
 * @return {boolean} f or ID of the proposal - or throws error
 */
// eslint-disable-next-line no-unused-vars
function clientSetProposalCurrent(pnS) {
  var fS = "clientSetProposalCurrent";
  var dbInst;
  Logger.log(`Getting into clientSetProposalCurrent with ${pnS}`);
  try {
    const dbInst = dbInstG;
    const propListInst = propListInstG;
    // propInst = new proposalC(dbInst, pnS);
    // var pid = propInst.getID();
    const pid = propListInst.getIDfromName(pnS);
    propListInst.setCurr(pid);
    var ret = setProposalCurrent(pid);
    if (!ret)
      throw new Error(`problem in setProposalCurrent for ${pnS}`);
    var overDA = clientGetCDData(pnS);
    if (!ret)
      throw new Error(`problem in clientGetCDData for ${pnS}`);


  } catch (err) {
    Logger.log(`In ${fS}: ${err}`);
    dbInst.closeconn();
    return false;
  }
  dbInst.closeconn();
  return overDA;
}
