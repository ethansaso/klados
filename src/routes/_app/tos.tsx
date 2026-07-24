import { Box, Heading, Link as RadixLink, Text } from "@radix-ui/themes";
import { createFileRoute, Link as TSLink } from "@tanstack/react-router";
import { ContentContainer } from "../../components/ContentContainer";
import { ProseSections } from "../../components/prose/ProseSections";

export const Route = createFileRoute("/_app/tos")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ContentContainer align="start">
      <article aria-labelledby="tos-title">
        <Box mb="4">
          <Heading id="tos-title">Terms of Service</Heading>
          <Text color="gray">Effective date: January 25th, 2026</Text>
        </Box>
        <ProseSections.Section>
          <ProseSections.Content>
            Welcome to Klados ("we", "us", or "the Service"). By accessing or
            using{" "}
            <RadixLink href="https://klados.bio">https://klados.bio</RadixLink>{" "}
            (the "Site"), you agree to these Terms of Service (the "Terms"). If
            you do not agree to these Terms, do not use the Service.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="1. Purpose of the Service">
          <ProseSections.Content>
            Klados is an educational platform for exploring, maintaining, and
            sharing biological identification resources, including structured
            morphological data, flowcharts, and user-authored guides. The
            Service is provided for informational and educational purposes only.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="2. Accounts and Eligibility">
          <ProseSections.Content>
            To access certain features of Klados, you may be required to create
            an account. You must be at least 13 years old to create an account.
            You are responsible for maintaining the security of your account.
          </ProseSections.Content>
          <ProseSections.Content>
            You must not use the Service in a way that violates any applicable
            laws or regulations.
          </ProseSections.Content>
          <ProseSections.Content>
            We may suspend or terminate your account at any time for violations
            of these Terms.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="3. User-Generated Content">
          <ProseSections.Subsection title="3.1. Responsibility">
            <ProseSections.Content>
              You are solely responsible for any content you submit, upload, or
              create on the Site ("User Content").
            </ProseSections.Content>
            <ProseSections.Content>
              You represent and warrant that:
            </ProseSections.Content>
            <ul>
              <li>
                You own or have the necessary rights to use and share your User
                Content
              </li>
              <li>
                Your User Content does not infringe upon the intellectual
                property rights of others
              </li>
              <li>
                Your User Content complies with all applicable laws and
                regulations
              </li>
            </ul>
          </ProseSections.Subsection>
          <ProseSections.Subsection title="3.2. License to Klados">
            <ProseSections.Content>
              By submitting User Content, you grant Klados a non-exclusive,
              worldwide, royalty-free license to host, display, reproduce, and
              distribute that content solely for the purpose of operating,
              improving, and promoting the Service.
            </ProseSections.Content>
            <ProseSections.Content>
              You retain ownership of your User Content.
            </ProseSections.Content>
          </ProseSections.Subsection>
          <ProseSections.Subsection title="3.3. Prohibited Content">
            <ProseSections.Content>
              You agree not to submit User Content that:
            </ProseSections.Content>
            <ul>
              <li>
                Infringes upon the rights of others, including copyright or
                other intellectual property rights
              </li>
              <li>
                Contains substantive expressive material from books, articles,
                databases, or other protected works without permission
              </li>
              <li>Is unlawful, harmful, or offensive</li>
            </ul>
          </ProseSections.Subsection>
        </ProseSections.Section>
        <ProseSections.Section title="4. Copyright and DMCA Policy">
          <ProseSections.Content>
            Klados respects the intellectual property rights of others.
          </ProseSections.Content>
          <ProseSections.Content>
            If you believe content on the Site infringes your copyright, please
            submit a notice in accordance with our{" "}
            <RadixLink asChild>
              <TSLink to="/dmca">Copyright / DMCA Policy</TSLink>
            </RadixLink>
            .
          </ProseSections.Content>
          <ProseSections.Content>
            We may remove or disable access to allegedly infringing content and
            may terminate accounts of repeat infringers.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="5. Repeat Infringer Policy">
          <ProseSections.Content>
            Klados has adopted a policy of terminating accounts of users who are
            determined to be repeat infringers under applicable copyright law.
            This policy is implemented in appropriate circumstances and at
            Klados's sole discretion.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="6. No Monitoring Obligation">
          <ProseSections.Content>
            Klados does not actively monitor or review user-generated content
            prior to publication. We reserve the right to remove content at any
            time, but we are not obligated to do so.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="7. Third-Party Content and Links">
          <ProseSections.Content>
            The Site may display content from third-party sources (such as
            images or links to external databases) with attribution. Klados does
            not control and is not responsible for third-party content.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="8. Disclaimer of Warranties">
          <ProseSections.Content>
            The Service is provided "as is" and "as available".
          </ProseSections.Content>
          <ProseSections.Content>
            Klados makes no warranties regarding:
          </ProseSections.Content>
          <ul>
            <li>Accuracy or completeness of biological data</li>
            <li>Fitness for identification, research, or professional use</li>
            <li>Continuous or error-free operation</li>
          </ul>
          <ProseSections.Content>
            You use the Service at your own risk.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="9. Limitation of Liability">
          <ProseSections.Content>
            To the maximum extent permitted by law, Klados shall not be liable
            for any indirect, incidental, special, consequential, or punitive
            damages arising out of or related to your use of the Service.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="10. Indemnification">
          <ProseSections.Content>
            You agree to indemnify and hold harmless Klados from any claims,
            damages, or expenses arising from your User Content or your use of
            the Service in violation of these Terms.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="11. Modifications">
          <ProseSections.Content>
            We may update these Terms from time to time. Continued use of the
            Service after changes constitutes acceptance of the revised Terms.
          </ProseSections.Content>
          <ProseSections.Content>
            We may modify, suspend, or discontinue the Service (or any part of
            it) at any time, with or without notice.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="12. Governing Law">
          <ProseSections.Content>
            These Terms are governed by the laws of the State of California,
            without regard to its conflict of law principles.
          </ProseSections.Content>
          <ProseSections.Content>
            Any disputes arising under or in connection with these Terms shall
            be resolved in the state or federal courts located in California.
          </ProseSections.Content>
        </ProseSections.Section>
        <ProseSections.Section title="13. Contact">
          <ProseSections.Content>
            For questions about these Terms or copyright concerns, contact:
          </ProseSections.Content>
          <Text as="p">
            Email:{" "}
            <RadixLink href="mailto:support@klados.bio">
              support@klados.bio
            </RadixLink>
          </Text>
          <Text as="p">
            DMCA Agent:{" "}
            <RadixLink href="mailto:dmca@klados.bio">dmca@klados.bio</RadixLink>
          </Text>
        </ProseSections.Section>
      </article>
    </ContentContainer>
  );
}
