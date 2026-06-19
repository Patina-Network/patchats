import {
  Box,
  Button,
  Flex,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useState, type FormEvent } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newErrors = {
      email: "",
      password: "",
    };

    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    if (newErrors.email || newErrors.password) {
      return;
    }

    // Login handler is not in scope for this ticket.
    console.log("Admin login submitted", { email, password });
  };

  return (
    <Flex direction="column" mih="100vh" p="xl">
      <Flex align="center" component="header" gap="md">
        <Box bd="1px solid var(--mantine-color-default-border)" h={56} w={56} />
        <Title order={1} size="h3">
          PatChats
        </Title>
      </Flex>
      <Flex align="flex-start" flex={1} justify="center" pt={160}>
        <Box component="form" maw={280} onSubmit={handleSubmit} w="100%">
          <Stack gap="md">
            <Title order={2} size="h4" ta="center">
              Admin Log in
            </Title>
            <TextInput
              error={errors.email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="Admin email"
              radius="md"
              size="sm"
              value={email}
            />
            <PasswordInput
              error={errors.password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder="Password"
              radius="md"
              size="sm"
              value={password}
            />
            <Button fullWidth radius="md" size="sm" type="submit">
              Admin Log in
            </Button>
          </Stack>
        </Box>
      </Flex>
    </Flex>
  );
}
