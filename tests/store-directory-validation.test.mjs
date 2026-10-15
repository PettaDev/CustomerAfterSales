import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const content=()=>readFile(new URL("../public/pontos-de-apoio/locations.json",import.meta.url),"utf8");
const approvedBrand=new Set(["infinix","tecno","itel"]);
const validLocation=location=>{
  assert.ok(location.id && /^[a-z0-9-]{6,64}$/.test(location.id),"stable location id is required");
  assert.ok(approvedBrand.has(location.brand),"brand must be allowed");
  for(const field of ["label","city","state","addressLine","district","country","venue"]){
    assert.ok(typeof location[field]==="string" && location[field].trim(),field+" must be filled");
  }
  assert.match(location.state,/^[A-Z]{2}$/);
  assert.equal(location.country,"BR");
  assert.match(location.postalCode,/^\d{5}-\d{3}$/);
  assert.ok(location.logo?.startsWith("/brandmarks/"),"placeholder brand logo must be local");
  // A product sales store is not an official authorized repair center by inference.
  assert.equal(typeof location.officialServiceCenter,"boolean");
  if(location.officialServiceCenter){
    assert.ok(location.lastVerifiedAt && location.verifiedBy,"authorized service requires verification provenance");
  }
  for(const flag of ["repairAuthorized","logCollectionAvailable","warrantyServiceAvailable"]){
    assert.ok(location[flag]===null || typeof location[flag]==="boolean",flag+" must be null or boolean");
    if(location[flag]===true)assert.ok(location.lastVerifiedAt && location.verifiedBy,flag+" requires approval provenance");
  }
  if(location.photo)assert.ok(location.photo.startsWith("/stores/"),"use only local, permission-cleared store photos");
};

test("public store catalog contains no duplicate IDs or locations and prevents unsupported service claims",async()=>{
  const db=JSON.parse(await content());
  assert.equal(db.version,1);
  assert.ok(Array.isArray(db.locations) && db.locations.length>0);
  const ids=new Set(),addresses=new Set();
  for(const location of db.locations){
    validLocation(location);
    assert.ok(!ids.has(location.id),"duplicate store id");
    ids.add(location.id);
    const address=[location.addressLine,location.units,location.city,location.state].join("|").toLowerCase();
    assert.ok(!addresses.has(address),"duplicate store address");
    addresses.add(address);
  }
});
