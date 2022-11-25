
class propDetailC {
  constructor(dbInst, propID) {
    this.propDetailA = createPropDetailA(dbInst, propID);
  }
  getAnswerFromCK(ckS) {
    var found = this.propDetailA.find(c => c.ck === ckS);
    return found?.ans
  }
}

class ckSectionAC {
  constructor() {
    this.expA = ['oePerInc', 'oeBaseYear', 'retBaseYear', 'elecDirect', 'elecSubmeter'];
    this.optA = ['optRenew', 'optYears', 'optROFO', 'optROFR'];
    this.overA = ['secDeposit', 'useType', 'llName', 'llbrokerName', 'proposalSalutation', 'recipientEmail', 'llbrokerCo', 'llbrokerAddr', 'commDate', 'leaseTerm', 'earlyAccess'];
    this.parkA = ['parkUnreservedNum', 'parkUnreservedRatio', 'parkUnreservedCost', 'parkReservedNum',
      'parkReservedRatio', 'parkReservedCost', 'parkMaxEscPercent', 'parkDescription'];
    this.tiA = ['tiAllow', 'tiFreight', 'tiAccess', 'tiCompBid', 'llWork'];
  }

  getExpA() {
    return this.expA
  }
  getOptA() {
    return this.optA
  }
  getOverA() {
    return this.overA
  }
  getParkA() {
    return this.parkA
  }
  getTIA() {
    return this.tiA
  }
  class ckLocalSectionAC extends ckSectionAC {
  getExpA(loc) {
    var e = super.getExpA();
    if (loc === "New York") {
      e.push('elecRentInc');
      e.push('elecRentIncCharge');  
    }
    return e 
  }
  getParkA(loc) {
    if (loc === "New York") {
      return []
    }
    return super.getParkA()
  }
}
}