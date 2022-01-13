/*global Logger */

/**
 * Purpose: takes a proposal size, a clausekey, and a set of rows from
 * the prop_detail_ex view and tests from L->M->S to find the best
 * match, throwing an error if there are no matches
 *
 * @param  {String} propSize - param
 * @param  {String} ck - clause key
 * @param  {Object[]} pdrs - proposal detail rows
 * @return {Object} r - row object or false
 */

// eslint-disable-next-line no-unused-vars
function matchProposalSizeWithClause(propSize, pdrs) {
  const fS = "matchProposalSizeWithClause";
  try {
    var r = "";
    var probS = `clause size ${propSize} not found`
    switch (propSize) {
      case "L":
        // find exact match if possible
        r = retRowF("L", pdrs);
        if (r) return r;
        r = retRowF("M", pdrs);
        if (r) return r;
        r = retRowF("S", pdrs);
        if (r) return r;
        throw new Error(probS)
      case "M":
        // find exact match if possible
        r = retRowF("M", pdrs);
        if (r) return r;
        r = retRowF("S", pdrs);
        if (r) return r;
        throw new Error(probS)
      case "S":
        r = retRowF("S", pdrs);
        if (r) return r;
        throw new Error(probS)
    } // end switch

  } // end try
  catch (err) {
    const probS = `In ${fS}: ${err} `;
    Logger.log(probS);
  }
  // if we haven't returned above it measn that we didn't find any matches
  return false
}

function retRowF(findSize, pdrs) {
  for (var i = 0; i < pdrs.length; i++) {
    if (pdrs[i].clauseSize === findSize) return pdrs[i]
  }
  return false
}