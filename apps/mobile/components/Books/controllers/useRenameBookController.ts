import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

type FormValues = { name: string };

type Deps = {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onConfirm: (nextName: string) => Promise<void> | void;
};

export function useRenameBookController(deps: Deps) {
  const { control, reset, setValue, watch, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { name: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!deps.visible) return;
    reset({ name: deps.currentName ?? "" });
  }, [deps.visible, deps.currentName, reset]);

  const name = watch("name");
  const trimmed = useMemo(() => (name ?? "").trim(), [name]);

  const canSubmit =
    deps.visible &&
    !!trimmed &&
    trimmed !== (deps.currentName ?? "").trim() &&
    !formState.isSubmitting;

  const submit = handleSubmit(async (values) => {
    const next = (values.name ?? "").trim();
    if (!next) return;

    // güvenlik
    if (next === (deps.currentName ?? "").trim()) {
      deps.onClose();
      return;
    }

    await deps.onConfirm(next);
    deps.onClose();
  });

  return {
    control,
    setValue,
    submit,
    canSubmit,
    isSubmitting: formState.isSubmitting,
    errors: formState.errors,
  };
}
