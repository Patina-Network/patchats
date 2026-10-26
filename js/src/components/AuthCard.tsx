import { Container, Divider, Paper, Stack, Text, Title } from "@mantine/core";
import { ReactNode } from "react";

export function AuthCard({
  title,
  description,
  children,
  footer,
  width = 440,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  return (
    <Container size={width} py="xl">
      <Paper p={{ base: "lg", xs: "xl" }} radius="md" withBorder>
        <Stack gap="lg">
          <Stack gap="xs">
            <Title order={2} size="h3">
              {title}
            </Title>
            {description && (
              <Text c="dimmed" size="sm">
                {description}
              </Text>
            )}
          </Stack>
          {children}
          {footer && (
            <>
              <Divider />
              <Text c="dimmed" size="sm" ta="center">
                {footer}
              </Text>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
