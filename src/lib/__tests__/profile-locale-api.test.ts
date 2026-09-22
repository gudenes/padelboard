import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
const updateUser = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  serverSupabase: async () => ({ auth: { getUser, updateUser } }),
}))

import { POST } from '@/app/api/profile/locale/route'

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/profile/locale', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
}

describe('POST /api/profile/locale', () => {
  beforeEach(() => {
    getUser.mockReset()
    updateUser.mockReset()
    updateUser.mockResolvedValue({ error: null })
  })

  it('devolve 401 sem sessão', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    expect((await post({ locale: 'pt' })).status).toBe(401)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('rejeita um locale não suportado', async () => {
    getUser.mockResolvedValue({ data: { user: { user_metadata: {} } } })

    expect((await post({ locale: 'de' })).status).toBe(400)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('preserva os restantes campos do perfil', async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          user_metadata: {
            padelboard_profile: { name: 'Gu', role: 'player', completed: true },
          },
        },
      },
    })

    expect((await post({ locale: 'it' })).status).toBe(200)
    expect(updateUser).toHaveBeenCalledWith({
      data: {
        padelboard_profile: {
          name: 'Gu',
          role: 'player',
          completed: true,
          locale: 'it',
        },
      },
    })
  })
})
