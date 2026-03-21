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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for PayNudge</Preview>
    <Body style={main}>
      <Container style={container}>
        <table cellPadding="0" cellSpacing="0" style={{ marginBottom: '32px' }}><tr>
          <td style={{ width: '16px', height: '16px', backgroundColor: '#00D4A8', borderRadius: '3px' }} />
          <td style={{ paddingLeft: '8px', fontFamily: "'DM Sans', Arial, sans-serif", fontWeight: 'bold', fontSize: '18px', color: '#0d0f12' }}>PayNudge</td>
        </tr></table>
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your PayNudge email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm email change
        </Button>
        <Text style={footer}>
          If you didn't request this, please secure your account immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 32px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0d0f12', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#737a8c', lineHeight: '1.6', margin: '0 0 28px' }
const link = { color: '#00D4A8', textDecoration: 'underline' }
const button = { backgroundColor: '#00D4A8', color: '#000000', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
