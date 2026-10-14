import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const data=JSON.parse(await readFile(new URL("../public/pontos-de-apoio/locations.json",import.meta.url),"utf8"));
assert.equal(data.version,1);
assert.ok(Array.isArray(data.locations),"Expected locations array");
const ids=new Set();
for(const location of data.locations){
  for(const key of ["id","label","brand","addressLine","city","state","country"])
    assert.ok(typeof location[key]==="string" && location[key].trim(),key+" required");
  assert.ok(/^[a-z0-9-]{5,90}$/.test(location.id),"Safe ID required");
  assert.ok(!ids.has(location.id),"Duplicate store ID");
  ids.add(location.id);
  assert.ok(["infinix","tecno","itel"].includes(location.brand),"Unknown brand");
  assert.equal(location.country,"BR");
  assert.ok(/^[A-Z]{2}$/.test(location.state),"Expected Brazilian state abbreviation");
  assert.ok(location.phone==null||typeof location.phone==="string");
  assert.ok(location.hours==null||typeof location.hours==="string");
  assert.ok(location.photo==null||/^\/store-photos\/[a-zA-Z0-9._-]+\.(?:png|jpg|jpeg|webp)$/.test(location.photo));
  assert.ok(location.logo==null||/^\/brandmarks\/(infinix|tecno|itel)\.svg$/.test(location.logo));
  const approved=location.status==="verified";
  if(location.officialServiceCenter===true)assert.ok(approved&&location.repairAuthorized===true,
    "Never advertise authorized repair without verified status");
  for(const key of ["repairAuthorized","logCollectionAvailable","warrantyServiceAvailable"])
    assert.ok([true,false,null].includes(location[key]),"Explicit capability required");
  // A pending commercial address is not proof that the business provides repair.
  if(!approved)assert.equal(location.officialServiceCenter,false);
}
console.log("BRTE store directory verified: "+ids.size+" unique location(s); none assumed to offer repair.");
