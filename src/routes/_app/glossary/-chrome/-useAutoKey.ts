import { useEffect, useState } from "react";
import {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseFormSetValue,
  useFormState,
  useWatch,
} from "react-hook-form";
import { snakeCase } from "../../../../lib/utils/casing";

type StringPath<T extends FieldValues> = {
  [P in FieldPath<T>]: FieldPathValue<T, P> extends string ? P : never;
}[FieldPath<T>];

export function useAutoKey<
  T extends FieldValues,
  S extends StringPath<T>,
  K extends StringPath<T>,
>(
  control: Control<T>,
  setValue: UseFormSetValue<T>,
  sourceField: S,
  keyField: K
) {
  const { isSubmitted } = useFormState({ control });

  const sourceVal = useWatch({ control, name: sourceField });
  const keyVal = useWatch({ control, name: keyField });

  const [autoKey, setAutoKey] = useState(true);

  useEffect(() => {
    if (!autoKey) return;

    setValue(
      keyField,
      snakeCase((sourceVal ?? "") as string) as FieldPathValue<T, K>,
      { shouldDirty: true, shouldValidate: isSubmitted }
    );
  }, [autoKey, sourceVal, setValue, keyField, isSubmitted]);

  const handleKeyBlur = () => {
    if (autoKey) return;

    setValue(
      keyField,
      snakeCase((keyVal ?? "") as string) as FieldPathValue<T, K>,
      { shouldDirty: true, shouldValidate: isSubmitted }
    );
  };

  return { autoKey, setAutoKey, handleKeyBlur };
}
