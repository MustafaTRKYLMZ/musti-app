import React from "react";
import type { Control, FieldErrors } from "react-hook-form";

import { RepeatEditor } from "@/components/Books/RepeatEditor";
import type { CreateTargetFormValues } from "/forms";
import { formStyles } from "@/components/Books/forms/formStyles";

type ChipColors = {
  active: { bg: string; border: string; text: string; icon: string };
  inactive: { bg: string; border: string; text: string; icon: string };
};

type Props = {
  control: Control<CreateTargetFormValues>;
  errors: FieldErrors<CreateTargetFormValues>;
  setValue: (name: any, value: any, options?: any) => void;
  getValues: () => CreateTargetFormValues;
  chipColors: ChipColors;
};

export function RepeatFields({ setValue, getValues, chipColors }: Props) {
  const repeat = getValues().repeat;

  return (
    <RepeatEditor
      sectionTitleStyle={formStyles.sectionTitle}
      chipColors={chipColors}
      repeatEnabled={repeat.enabled}
      onToggleEnabled={() =>
        setValue("repeat.enabled", !repeat.enabled, { shouldValidate: true })
      }
      repeatFreq={repeat.freq as any}
      onChangeFreq={(v) =>
        setValue("repeat.freq", v as any, { shouldValidate: true })
      }
      repeatInterval={repeat.interval}
      onChangeInterval={(v) =>
        setValue("repeat.interval", v, { shouldValidate: true })
      }
      selectedWeekdays={repeat.weekdays}
      onToggleWeekday={(d) => {
        const prev = getValues().repeat.weekdays ?? [];
        const has = prev.includes(d);
        const next = has ? prev.filter((x) => x !== d) : [...prev, d];
        setValue("repeat.weekdays", next.length ? next : [1], {
          shouldDirty: true,
          shouldValidate: true,
        });
      }}
      repeatTimeOfDay={repeat.timeOfDay}
      onChangeTimeOfDay={(v) =>
        setValue("repeat.timeOfDay", v, { shouldValidate: true })
      }
      endKind={repeat.endKind}
      onChangeEndKind={(v) =>
        setValue("repeat.endKind", v, { shouldValidate: true })
      }
      untilDate={repeat.untilDate}
      onChangeUntilDate={(d) =>
        setValue("repeat.untilDate", d, { shouldValidate: true })
      }
      countRemaining={repeat.countRemaining}
      onChangeCountRemaining={(v) =>
        setValue("repeat.countRemaining", v, { shouldValidate: true })
      }
      showUntilPicker={repeat.showUntilPicker}
      onSetShowUntilPicker={(v) => setValue("repeat.showUntilPicker", v)}
    />
  );
}
