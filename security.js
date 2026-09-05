const crypto = require('crypto');

function sha256(value, secret) {
  return crypto.createHmac('sha256', secret).update(String(value || '')).digest('hex');
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || '';
}

function installationId(req) {
  return String(req.headers['x-aurexa-installation-id'] || '').trim().slice(0, 200);
}

function idempotencyKey(req) {
  return String(req.headers['idempotency-key'] || '').trim().slice(0, 200);
}

function registerSecurityRoutes(app, { supabase, requireFirebaseUser }) {
  const secret = String(process.env.AUREXA_ANTI_ABUSE_SECRET || '').trim();
  const bonusAmount = Number(process.env.AUREXA_WELCOME_BONUS_DIAMONDS || 0);

  app.post('/api/security/bonus-precheck', requireFirebaseUser, async (req, res) => {
    try {
      if (!secret) return res.status(503).json({ ok: false, error: 'Anti-abuse secret is not configured' });
      if (req.firebaseUser.emailVerified !== true) {
        return res.status(403).json({ ok: false, error: 'Debes verificar tu correo antes de reclamar el bono' });
      }

      const installation = installationId(req);
      const idem = idempotencyKey(req);
      if (!installation || !idem) {
        return res.status(400).json({ ok: false, error: 'Faltan identificador de instalación o clave de idempotencia' });
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('id,welcome_bonus_claimed').eq('firebase_uid', req.firebaseUser.uid).maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.id) return res.status(409).json({ ok: false, error: 'Perfil AUREXA no encontrado' });
      if (profile.welcome_bonus_claimed === true) {
        return res.status(409).json({ ok: false, error: 'El bono ya fue reclamado por esta cuenta' });
      }

      const installationHash = sha256(installation, secret);
      const ipHash = sha256(clientIp(req), secret);
      const emailDomain = String(req.firebaseUser.email || '').split('@')[1]?.toLowerCase() || null;

      const { data, error } = await supabase.rpc('aurexa_security_claim_precheck', {
        p_user_id: profile.id,
        p_installation_hash: installationHash,
        p_ip_hash: ipHash,
        p_email_domain: emailDomain,
        p_idempotency_key: idem
      });
      if (error) throw error;

      if (data?.decision === 'blocked') return res.status(403).json({ ok: false, error: 'Reclamación bloqueada por seguridad', decision: data.decision, claimId: data.claim_id });
      if (data?.decision === 'held') return res.status(202).json({ ok: true, decision: 'held', claimId: data.claim_id, message: 'Reclamación retenida para revisión de seguridad' });
      return res.json({ ok: true, decision: data?.decision || 'pending', claimId: data?.claim_id || null, riskScore: data?.risk_score ?? null });
    } catch (error) {
      console.error('bonus-precheck error:', error.message);
      return res.status(500).json({ ok: false, error: 'No se pudo completar la comprobación de seguridad' });
    }
  });

  app.post('/api/security/bonus-claim', requireFirebaseUser, async (req, res) => {
    try {
      if (!secret) return res.status(503).json({ ok: false, error: 'Anti-abuse secret is not configured' });
      if (!Number.isSafeInteger(bonusAmount) || bonusAmount <= 0) {
        return res.status(503).json({ ok: false, error: 'Welcome bonus amount is not configured' });
      }
      if (req.firebaseUser.emailVerified !== true) {
        return res.status(403).json({ ok: false, error: 'Debes verificar tu correo antes de reclamar el bono' });
      }

      const installation = installationId(req);
      const idem = idempotencyKey(req);
      if (!installation || !idem) {
        return res.status(400).json({ ok: false, error: 'Faltan identificador de instalación o clave de idempotencia' });
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('id,welcome_bonus_claimed').eq('firebase_uid', req.firebaseUser.uid).maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.id) return res.status(409).json({ ok: false, error: 'Perfil AUREXA no encontrado' });
      if (profile.welcome_bonus_claimed === true) {
        return res.status(409).json({ ok: false, error: 'El bono ya fue reclamado por esta cuenta' });
      }

      const installationHash = sha256(installation, secret);
      const ipHash = sha256(clientIp(req), secret);
      const emailDomain = String(req.firebaseUser.email || '').split('@')[1]?.toLowerCase() || null;
      const { data: precheck, error: precheckError } = await supabase.rpc('aurexa_security_claim_precheck', {
        p_user_id: profile.id,
        p_installation_hash: installationHash,
        p_ip_hash: ipHash,
        p_email_domain: emailDomain,
        p_idempotency_key: idem
      });
      if (precheckError) throw precheckError;

      if (precheck?.decision === 'blocked') return res.status(403).json({ ok: false, error: 'Reclamación bloqueada por seguridad', decision: precheck.decision, claimId: precheck.claim_id });
      if (precheck?.decision === 'held') return res.status(202).json({ ok: true, decision: 'held', claimId: precheck.claim_id, message: 'Reclamación retenida para revisión de seguridad' });

      const claimId = precheck?.claim_id;
      if (!claimId) return res.status(409).json({ ok: false, error: 'No se pudo crear la reclamación' });

      const { data: result, error: claimError } = await supabase.rpc('aurexa_claim_welcome_bonus', {
        p_claim_id: claimId,
        p_bonus_amount: bonusAmount
      });
      if (claimError) throw claimError;

      if (result?.decision === 'approved' || result?.decision === 'already_approved') {
        return res.json({ ok: true, decision: result.decision, claimId: result.claim_id, creditedAmount: result.credited_amount });
      }
      return res.status(409).json({ ok: false, decision: result?.decision || 'not_approved', claimId: result?.claim_id || claimId });
    } catch (error) {
      console.error('bonus-claim error:', error.message);
      return res.status(500).json({ ok: false, error: 'No se pudo completar la reclamación del bono' });
    }
  });
}

module.exports = { registerSecurityRoutes };