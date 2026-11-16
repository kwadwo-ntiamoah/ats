"use client";

import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

function toDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const parsed = parseISO(String(value));
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

interface DateFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label: string;
    placeholder?: string;
    disabled?: (date: Date) => boolean;
    required?: boolean;
}

export function DateField<T extends FieldValues>({
    control,
    name,
    label,
    placeholder = "Pick a date",
    disabled,
    required,
}: DateFieldProps<T>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor={name}>
                        {label}
                        {required && <span className="text-destructive">*</span>}
                    </FieldLabel>
                    <Popover>
                        {/* The trigger is the button itself: a <Button> inside the trigger's own
                            <button> is invalid HTML and breaks hydration, crashing the page. */}
                        <PopoverTrigger
                            id={name}
                            aria-invalid={!!fieldState.error}
                            className={cn(
                                // Same look as the other inputs (account select, amount, PIN):
                                // full width, 44px tall, small radius, icon on the left.
                                "flex h-11 w-full items-center gap-2 rounded-md border border-input bg-transparent px-2 text-left text-sm shadow-xs outline-none transition-[color,box-shadow]",
                                "focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/50",
                                "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
                                !field.value && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="size-4 text-black/40" />
                            {field.value ? format(toDate(field.value)!, "dd MMM yyyy") : placeholder}
                        </PopoverTrigger>
                        {/* As wide as the date field it opens from. */}
                        <PopoverContent className="w-(--anchor-width) p-0" align="start">
                            <Calendar
                                className="w-full"
                                classNames={{ root: "w-full" }}
                                mode="single"
                                selected={toDate(field.value)}
                                // Stored as "yyyy-MM-dd", which is what the form schema and API expect.
                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                disabled={disabled}
                                autoFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                </Field>
            )}
        />
    );
}