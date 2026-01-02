import { Box, Callout, Flex, IconButton, Text } from "@radix-ui/themes";
import { Toast } from "radix-ui";
import { PiCheck, PiInfo, PiWarning, PiX } from "react-icons/pi";
import { useToastStore } from "../lib/utils/toast";

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((t) => {
        let icon: React.ReactNode;
        let color: "grass" | "tomato" | "blue";
        let bgColor: string;
        let borderColor: string;
        switch (t.variant) {
          case "success":
            icon = <PiCheck />;
            color = "grass";
            bgColor = "grass-3";
            borderColor = "grass-5";
            break;
          case "error":
            icon = <PiWarning />;
            color = "tomato";
            bgColor = "tomato-3";
            borderColor = "tomato-5";
            break;
          default:
            icon = <PiInfo />;
            color = "blue";
            bgColor = "blue-3";
            borderColor = "blue-5";
        }

        return (
          <Toast.Root key={t.id} duration={t.duration}>
            <Callout.Root
              color={color}
              variant="soft"
              role={t.variant === "error" ? "alert" : "status"}
              style={{
                position: "relative",
                backgroundColor: `var(--${bgColor})`,
                borderColor: `var(--${borderColor})`,
              }}
            >
              <Callout.Icon>{icon}</Callout.Icon>
              <Flex asChild direction="column" gap="1">
                <Callout.Text>
                  <Toast.Title asChild>
                    <Text weight="bold">{t.title}</Text>
                  </Toast.Title>
                  <Toast.Description asChild>
                    <Text>{t.description}</Text>
                  </Toast.Description>
                </Callout.Text>
              </Flex>
              <Toast.Close onClick={() => remove(t.id)} asChild color={color}>
                <Box position="absolute" top="4" right="4">
                  <IconButton size="1" variant="ghost">
                    <PiX />
                  </IconButton>
                </Box>
              </Toast.Close>
            </Callout.Root>
          </Toast.Root>
        );
      })}

      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
