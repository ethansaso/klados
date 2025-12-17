import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Card,
  Flex,
  Heading,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { Label } from "radix-ui";
import { useForm } from "react-hook-form";
import z from "zod";
import { a11yProps, ConditionalAlert } from "./inputs/ConditionalAlert";

const contactFormValidator = z.object({
  name: z.string().min(1, "Enter your email or username."),
  email: z.email("Enter a valid email address."),
  message: z.string().min(1, "Enter a message."),
});

export const ContactForm = () => {
  const {
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactFormValidator),
  });

  return (
    <Box mb="5">
      <Heading mb="3">Contact Us</Heading>
      <Card asChild>
        <form>
          <Box>
            <Flex justify="between" align="baseline" mb="1">
              <Label.Root htmlFor="name">Name</Label.Root>
              <ConditionalAlert
                id="name-error"
                message={errors.name?.message}
              />
            </Flex>
            <TextField.Root
              id="name"
              {...register("name")}
              {...a11yProps("name-error", !!errors.name)}
              placeholder="Your name"
              type="text"
              autoComplete="name"
            />
          </Box>
          <Box mt="4">
            <Flex justify="between" align="baseline" mb="1">
              <Label.Root htmlFor="email">Email</Label.Root>
              <ConditionalAlert
                id="email-error"
                message={errors.email?.message}
              />
            </Flex>
            <TextField.Root
              id="email"
              {...register("email")}
              {...a11yProps("email-error", !!errors.email)}
              placeholder="Your email address"
              type="email"
              autoComplete="email"
            />
          </Box>
          <Box mt="4">
            <Flex justify="between" align="baseline" mb="1">
              <Label.Root htmlFor="message">Message</Label.Root>
              <ConditionalAlert
                id="message-error"
                message={errors.message?.message}
              />
            </Flex>
            <TextArea
              id="message"
              placeholder="Your message..."
              {...register("message")}
              {...a11yProps("message-error", !!errors.message)}
            />
          </Box>
        </form>
      </Card>
    </Box>
  );
};
