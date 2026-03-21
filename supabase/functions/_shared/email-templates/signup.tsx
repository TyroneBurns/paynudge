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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for PayNudge</Preview>
    <Body style={main}>
      <Container style={container}>
        <table cellPadding="0" cellSpacing="0" style={{ marginBottom: '32px' }}><tr>
          <td style={{ width: '16px', height: '16px', backgroundColor: '#00D4A8', borderRadius: '3px' }} />
          <td style={{ paddingLeft: '8px', fontFamily: "'DM Sans', Arial, sans-serif", fontWeight: 'bold', fontSize: '18px', color: '#0d0f12' }}>PayNudge</td>
        </tr></table>
        <Heading style={h1}>Welcome aboard 👋</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}><strong>PayNudge</strong></Link>!
          Confirm your email ({' '}
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          {' '}) to get started.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify my email
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 32px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0d0f12', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#737a8c', lineHeight: '1.6', margin: '0 0 28px' }
const link = { color: '#00D4A8', textDecoration: 'underline' }
const button = { backgroundColor: '#00D4A8', color: '#000000', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
