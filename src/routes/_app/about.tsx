import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Card,
  Em,
  Flex,
  Heading,
  Link,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { Label } from "radix-ui";
import { useForm } from "react-hook-form";
import z from "zod";
import { ContentContainer } from "../../components/ContentContainer";
import {
  a11yProps,
  ConditionalAlert,
} from "../../components/inputs/ConditionalAlert";
import { KoFiWidget } from "../../components/KoFiWidget";

const contactFormValidator = z.object({
  name: z.string().min(1, "Enter your email or username."),
  email: z.email("Enter a valid email address."),
  message: z.string().min(1, "Enter a message."),
});

export const Route = createFileRoute("/_app/about")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    control,
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactFormValidator),
  });

  return (
    <ContentContainer>
      <Box mb="5">
        <Heading mb="3">Our Mission</Heading>
        <Text as="p" mb="2">
          Klados is a community-oriented taxonomy platform that provides both a
          free repository of morphological data and a modern interface for
          creating and sharing flowchart-style identification guides known as
          "dichotomous keys".
        </Text>

        <Text as="p" mb="2">
          Klados was created with the idea of free, equitable access to learning
          resources for anyone seeking to learn to identify organisms.
          Dichotomous keys for many fields are often hard to obtain, and are
          written in a jargon-heavy, inaccessible fashion which discourages
          newcomers to the field and ultimately hinders community contribution
          to science. Klados addresses this with an intuitive, modern
          alternative to traditional keys, accessible to all audiences.
        </Text>

        <Text as="p" size="2">
          <Em>
            Disclaimer: Klados is currently in early alpha. Generated keys
            and/or taxon descriptions may contain errors and should be reviewed
            before acceptance.
          </Em>
        </Text>
      </Box>
      <Box mb="5">
        <Heading mb="3">Meet the Founder</Heading>
        <Flex>
          <Box>
            <Text as="p" mb="2">
              Hi there! My name is Ethan Saso, and I'm a recent graduate from UC
              Berkeley with a degree in Molecular Environmental Biology and
              Computer Science. I previously led the university's Mycological
              Society and hold an immense passion for fungi and slime molds. In
              my free time, I also dabble in extreme macro photography of these
              extraordinary creatures, which you can view over on my{" "}
              <Link href="https://www.inaturalist.org/people/ethansaso">
                iNaturalist
              </Link>
              .
            </Text>
            <Text as="p" mb="2">
              You can also find me on{" "}
              <Link href="https://www.linkedin.com/in/ethansaso/">
                LinkedIn
              </Link>
              .
            </Text>
          </Box>
          <img src={"/about/ethan-about.jpg"} alt="Ethan Saso" height="208px" />
        </Flex>
      </Box>
      <Box mb="5">
        <Heading mb="3">Donate</Heading>
        <Text as="p" mb="2">
          While Klados is and will always be a free service, we pay out of
          pocket to keep it online. If you would like to support the site's
          development, please consider donating. Thank you!
        </Text>

        <KoFiWidget />
      </Box>
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
    </ContentContainer>
  );
}
