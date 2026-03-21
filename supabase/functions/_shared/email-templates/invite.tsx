/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to PayNudge</Preview>
    <Body style={main}>
      <Container style={container}>
        <table cellPadding="0" cellSpacing="0" style={{ marginBottom: '32px' }}><tr>
          <td style={{ width: '16px', height: '16px', backgroundColor: '#00D4A8', borderRadius: '3px' }} />
          <td style={{ paddingLeft: '8px', fontFamily: "'DM Sans', Arial, sans-serif", fontWeight: 'bold', fontSize: '18px', color: '#0d0f12' }}>PayNudge</td>
        </tr></table>
        <Heading style={h1}>You're invited 🎉</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}><strong>PayNudge</strong></Link>.
          Click below to accept and create your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 32px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0d0f12', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#737a8c', lineHeight: '1.6', margin: '0 0 28px' }
const link = { color: '#00D4A8', textDecoration: 'underline' }
const button = { backgroundColor: '#00D4A8', color: '#000000', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
