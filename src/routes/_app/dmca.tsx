import { Box, Heading, Link, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { ContentContainer } from "../../components/ContentContainer";
import { ProseSections } from "../../components/prose/ProseSections";

export const Route = createFileRoute("/_app/dmca")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ContentContainer align="start">
      <article aria-labelledby="dmca-heading">
        <Box mb="4">
          <Heading id="dmca-heading">Copyright & DMCA Policy</Heading>
          <Text color="gray">Effective date: January 25th, 2026</Text>
        </Box>
        <ProseSections.Section>
          <ProseSections.Content>
            Klados ("we," "us," or "the Service") respects the intellectual
            property rights of others and expects users of the Service to do the
            same.
          </ProseSections.Content>
          <ProseSections.Content>
            This policy describes how we respond to claims of copyright
            infringement in accordance with the Digital Millennium Copyright Act
            ("DMCA"), 17 U.S.C. §512.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="Notification of Alleged Copyright Infringement">
          <ProseSections.Content>
            If you believe that your copyrighted work has been copied in a way
            that constitutes copyright infringement and is accessible via the
            Service, please provide a Notification of Alleged Copyright
            Infringement to our Designated Copyright Agent at{" "}
            <Link href="mailto:dmca@klados.bio">dmca@klados.bio</Link>.
          </ProseSections.Content>
          <ProseSections.Content>
            Your Notification must include all information specified by the U.S.
            Copyright Office (
            <Link href="http://www.copyright.gov/">
              http://www.copyright.gov/
            </Link>
            ).
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="Counter-Notification">
          <ProseSections.Content>
            If you elect to submit a Counter-Notification, please send the
            Designated Copyright Agent a Counter-Notification using the contact
            information above.
          </ProseSections.Content>
          <ProseSections.Content>
            Your Counter-Notification must include all information specified by
            the U.S. Copyright Office (
            <Link href="http://www.copyright.gov/">
              http://www.copyright.gov/
            </Link>
            ).
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="Actions Taken">
          <ProseSections.Content>
            Upon receipt of a valid notice, we may take actions including
            removing or disabling access to the allegedly infringing content. We
            may also terminate accounts of repeat infringers in accordance with
            our Terms of Service.
          </ProseSections.Content>
        </ProseSections.Section>
      </article>
    </ContentContainer>
  );
}
