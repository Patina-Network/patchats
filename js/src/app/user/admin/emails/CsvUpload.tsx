"use client";

import { Button, FileInput, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { parsePairingFile, parseUserFile } from "src/app/user/admin/emails/parseCSV";

export default function CsvUpload() {
  const [userFile, setUserFile] = useState<File | null>(null);
  const [pairFile, setPairFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendUsers() {
    if (!userFile) return;
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const users = await parseUserFile(userFile);
      setStatus(`Sent user emails to ${users.size} recipient(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send user emails.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendPairings() {
    if (!pairFile) return;
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const pairs = await parsePairingFile(pairFile);
      setStatus(`Sent pairing emails for ${pairs.length} pairing(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send pairing emails.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="md" maw={480}>
      <Title order={3}>Send Emails</Title>

      <Stack gap="xs">
        <FileInput
          label="Users CSV"
          placeholder="Choose users CSV"
          accept=".csv,text/csv"
          value={userFile}
          onChange={setUserFile}
          clearable
        />
        <Button onClick={handleSendUsers} disabled={!userFile} loading={loading}>
          Send user emails
        </Button>
      </Stack>

      <Stack gap="xs">
        <FileInput
          label="Pairings CSV"
          placeholder="Choose pairings CSV"
          accept=".csv,text/csv"
          value={pairFile}
          onChange={setPairFile}
          clearable
        />
        <Button onClick={handleSendPairings} disabled={!pairFile} loading={loading}>
          Send pairing emails
        </Button>
      </Stack>

      {status && <Text c="green">{status}</Text>}
      {error && <Text c="red">{error}</Text>}
    </Stack>
  );
}
