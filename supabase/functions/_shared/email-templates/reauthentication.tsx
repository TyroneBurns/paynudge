/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your PayNudge verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <table cellPadding="0" cellSpacing="0" style={{ marginBottom: '32px' }}><tr>
          <td style={{ width: '16px', height: '16px', backgroundColor: '#00D4A8', borderRadius: '3px' }} />
          <td style={{ paddingLeft: '8px', fontFamily: "'DM Sans', Arial, sans-serif", fontWeight: 'bold', fontSize: '18px', color: '#0d0f12' }}>PayNudge</td>
        </tr></table>
        <Heading style={h1}>Verification code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. If you didn't request it, ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 32px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0d0f12', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#737a8c', lineHeight: '1.6', margin: '0 0 28px' }
const codeStyle = { fontFamily: "'JetBrains Mono', Courier, monospace", fontSize: '28px', fontWeight: 'bold' as const, color: '#00D4A8', margin: '0 0 32px', letterSpacing: '4px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
