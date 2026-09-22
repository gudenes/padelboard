/**
 * Códigos de erro estáveis devolvidos pela API.
 *
 * A API nunca devolve prosa traduzida: as respostas também são consumidas por
 * máquinas (cron, chamadas fora da UI) e a língua do pedido não pertence ao
 * corpo da resposta. O cliente resolve o código em `messages.errors`.
 *
 * Um código nomeia o PROBLEMA, não a frase. As frases inglesas vivem em
 * `src/messages/en.json`, sob `errors`, e o teste `api-errors.test.ts` garante
 * que os dois lados não divergem.
 *
 * Nota: os códigos-máquina que já existiam noutras rotas (`no_file`,
 * `rate_limited`, `unauthorized`, …) não passam por aqui — nunca foram prosa.
 */
export const API_ERROR_CODES = [
  // Genérico — usado pelo cliente quando o código é desconhecido.
  "unknown",

  // Sessão
  "sign_in_required",
  "sign_in_to_claim",
  "sign_in_to_send_feedback",

  // POST /api/board-design (+ validadores em lib/ai-board-design.ts)
  "wrong_origin",
  "request_too_large",
  "invalid_request",
  "design_source_required",
  "design_source_invalid",
  "website_url_invalid",
  "logo_type_invalid",
  "logo_too_large",
  "logo_unreadable",
  "ai_unavailable",
  "ai_busy",
  "ai_source_unreadable",
  "ai_failed",

  // POST /api/matches/[id]/action
  "action_invalid",
  "match_not_found",
  "not_match_owner",
  "match_finished",
  "match_finished_server_change",
  "match_not_started",
  "no_point_to_undo",
  "match_changed_elsewhere",

  // PATCH /api/matches/[id]/design (+ validador em lib/board-edit.ts)
  "design_invalid",
  "design_save_failed",
  "design_save_conflict",
  "board_template_required",
  "board_color_invalid",
  "board_title_too_long",
  "board_position_invalid",
  "board_scale_invalid",
  "board_timer_invalid",

  // POST /api/profile (+ validador em lib/player-profile.ts)
  "profile_invalid",
  "profile_save_failed",
  "avatar_save_failed",
  "profile_name_required",
  "profile_role_required",
  "profile_club_too_long",
  "profile_avatar_invalid",

  // POST /api/matches/[id]/claim
  "claim_token_required",
  "claim_failed",

  // POST /api/feedback
  "feedback_invalid",
  "feedback_send_failed",

  // POST /api/profile/locale
  "locale_unsupported",
  "locale_save_failed",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
