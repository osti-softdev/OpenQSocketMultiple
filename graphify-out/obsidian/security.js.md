---
source_file: "backend/utilities/security.js"
type: "code"
community: "Cluster 23"
location: "L1"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/Cluster_23
---

# security.js

## Connections
- [[AadminApi.js]] - `imports_from` [EXTRACTED]
- [[AtellerApi.js]] - `imports_from` [EXTRACTED]
- [[SECRET_KEY]] - `contains` [EXTRACTED]
- [[bcrypt_2]] - `contains` [EXTRACTED]
- [[crypto]] - `contains` [EXTRACTED]
- [[decrypt()]] - `indirect_call` [INFERRED]
- [[encrypt()]] - `indirect_call` [INFERRED]
- [[fs_9]] - `contains` [EXTRACTED]
- [[getClientIp()]] - `indirect_call` [INFERRED]
- [[hashPassword()]] - `indirect_call` [INFERRED]
- [[isBcryptHash()]] - `indirect_call` [INFERRED]
- [[normalizeIp()]] - `indirect_call` [INFERRED]
- [[path_12]] - `contains` [EXTRACTED]
- [[ref_bcrypt]] - `imports_from` [EXTRACTED]
- [[ref_crypto]] - `imports_from` [EXTRACTED]
- [[ref_fs]] - `imports_from` [EXTRACTED]
- [[ref_path]] - `imports_from` [EXTRACTED]
- [[securityHeaders()]] - `indirect_call` [INFERRED]
- [[server.js]] - `imports_from` [EXTRACTED]
- [[verifyAndUpgradePassword()]] - `indirect_call` [INFERRED]

#graphify/code #graphify/EXTRACTED #community/Cluster_23