CREATE TABLE IF NOT EXISTS operator_commands (id TEXT PRIMARY KEY, command TEXT NOT NULL, risk TEXT, status TEXT, payload_json TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS contact_messages (id TEXT PRIMARY KEY, name TEXT, email TEXT NOT NULL, phone TEXT, topic TEXT, message TEXT NOT NULL, status TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS mail_messages (id TEXT PRIMARY KEY, sender TEXT, recipient TEXT, subject TEXT, category TEXT, risk TEXT, status TEXT, body TEXT, draft TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS mail_drafts (id TEXT PRIMARY KEY, recipient TEXT, subject TEXT, body TEXT, send_policy TEXT, status TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS whatsapp_messages (id TEXT PRIMARY KEY, sender TEXT, recipient TEXT, body TEXT, category TEXT, risk TEXT, status TEXT, draft TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS chat_sessions (id TEXT PRIMARY KEY, agent_type TEXT, question TEXT, answer TEXT, command_json TEXT, sources_json TEXT, created_at TEXT);
CREATE INDEX IF NOT EXISTS idx_mail_risk ON mail_messages(risk);
CREATE INDEX IF NOT EXISTS idx_mail_category ON mail_messages(category);
CREATE INDEX IF NOT EXISTS idx_operator_command ON operator_commands(command);
