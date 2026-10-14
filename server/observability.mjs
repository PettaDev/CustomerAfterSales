import { randomUUID } from "node:crypto";

/** Safe request telemetry: never log names, phone, email, tokens, headers, case IDs or uploaded files. */
export function requestObservability(req, res, next) {
  const id=randomUUID();
  const started=Date.now();
  res.setHeader("X-Request-ID",id);
  res.setHeader("X-Content-Type-Options","nosniff");
  res.once("finish",()=>{
    if(res.statusCode<500)return;
    // Express route is a template (:id), unlike originalUrl which contains private identifiers.
    const route=typeof req.route?.path==="string"?req.route.path:"/api";
    console.error(JSON.stringify({
      event:"brte_api_server_error",
      requestId:id,
      route,
      method:req.method,
      status:res.statusCode,
      durationMs:Date.now()-started,
      at:new Date().toISOString(),
    }));
  });
  next();
}
