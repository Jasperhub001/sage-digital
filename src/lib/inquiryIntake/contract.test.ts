import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contactConfig } from '../../config/contact'
import { submitContactInquiry } from '../../services/contactService'

describe('Stage 10.3 inquiry intake contracts', () => {
  it('keeps public contact delivery on the Edge Function path', () => {
    expect(contactConfig.form.deliveryMode).toBe('edge-function')
  })

  it('wires submitContactInquiry to edge-function mode', async () => {
    await expect(
      submitContactInquiry({
        name: 'Test User',
        email: 'test@example.com',
        service: 'Websites',
        details: 'Enough characters for a valid enquiry body here.',
        website: 'http://bot.example',
      }),
    ).resolves.toMatchObject({
      ok: true,
      mode: 'edge-function',
    })
  })

  it('documents anonymous INSERT revocation in the hardening migration', () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20260405120000_storage_inquiry_hardening.sql',
      ),
      'utf8',
    )
    expect(sql).toContain(
      'revoke insert on table public.inquiries from anon, authenticated',
    )
    expect(sql).toContain(
      'drop policy if exists "Public can submit inquiries" on public.inquiries',
    )
  })

  it('documents atomic RPC privileges for service_role only', () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20260406120000_inquiry_rate_limit_rpc.sql',
      ),
      'utf8',
    )
    expect(sql).toContain('create or replace function public.consume_inquiry_rate_limit')
    expect(sql).toContain('for update')
    expect(sql).toContain('grant execute on function public.consume_inquiry_rate_limit')
    expect(sql).toContain('to service_role')
    expect(sql).toContain(
      'revoke all on function public.consume_inquiry_rate_limit(text, text, integer, integer, integer)\n  from public, anon, authenticated',
    )
    expect(sql).toContain('cleanup_inquiry_submission_throttle')
  })

  it('documents service_role table DML grants on the throttle table', () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20260407120000_inquiry_throttle_service_role_grants.sql',
      ),
      'utf8',
    )
    expect(sql).toContain(
      'revoke all on table public.inquiry_submission_throttle from anon, authenticated',
    )
    expect(sql).toMatch(
      /grant select, insert, update, delete\s+on table public\.inquiry_submission_throttle\s+to service_role/i,
    )
    expect(sql).not.toMatch(
      /grant\s+.*\s+on table public\.inquiry_submission_throttle\s+to\s+(anon|authenticated)/i,
    )
  })
})
