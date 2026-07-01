import { Flex, Text } from "@radix-ui/themes";
import { Label } from "radix-ui";
import type React from "react";
import { useRef } from "react";
import { PiUploadSimple } from "react-icons/pi";

interface Props {
  id?: string;
  label?: string;
  file: File | null;
  onChange: (file: File) => void;
}

export const FileUpload: React.FC<Props> = ({
  id = "file-input",
  label = "Select File",
  file,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Flex direction="column" gap="1">
      <Label.Root htmlFor={id}>{label}</Label.Root>
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="2"
        p="4"
        style={{
          border: "1px dashed var(--gray-8)",
          borderRadius: "var(--radius-3)",
          cursor: "pointer",
          color: "var(--gray-11)",
        }}
        onClick={() => inputRef.current?.click()}
      >
        <PiUploadSimple size={28} />
        <Text size="2" color="gray">
          {file ? file.name : "Upload an image"}
        </Text>
        <input
          ref={inputRef}
          id={id}
          type="file"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f);
          }}
        />
      </Flex>
    </Flex>
  );
};
