# Native integration boundary

Implement adapters for Keychain secure storage, WebRTC, APNs/PushKit, CallKit and background URLSession uploads in the generated iOS shell only after choosing versions compatible with that shell. Keep adapters behind small interfaces so REST/WebSocket code remains testable. No entitlement, key, certificate, profile or token belongs in this directory.
