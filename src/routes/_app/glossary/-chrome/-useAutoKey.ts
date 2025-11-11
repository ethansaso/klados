import { useEffect, useState } from "react";
import {
  Control,
  FieldValues,
  Path,
  UseFormSetValue,
  useFormState,
  useWatch,
} from "react-hook-form";
import { snakeCase } from "../../../../lib/utils/casing";

export function useAutoKey<T extends FieldValues>(
  control: Control<T>,
  setValue: UseFormSetValue<T>,
  sourceField: Path<T>,
  keyField: Path<T>
) {
  const { isSubmitted } = useFormState({ control });
  const sourceVal = useWatch({ control, name: sourceField });
  const keyVal = useWatch({ control, name: keyField });
  const [autoKey, setAutoKey] = useState(true);

  useEffect(() => {
    if (autoKey)
      setValue(keyField, snakeCase(sourceVal || "") as any, {
        shouldDirty: true,
        shouldValidate: isSubmitted,
      });
  }, [autoKey, sourceVal, setValue, keyField]);

  const handleKeyBlur = () => {
    if (!autoKey)
      setValue(keyField, snakeCase(keyVal || "") as any, {
        shouldDirty: true,
        shouldValidate: isSubmitted,
      });
  };

  return { autoKey, setAutoKey, handleKeyBlur };
}
