"use client";

import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

interface DateFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label: string;
    placeholder?: string;
    disabled?: (date: Date) => boolean;
}

export function DateField<T extends FieldValues>({
    control,
    name,
    label,
    placeholder = "Pick a date",
    disabled,
}: DateFieldProps<T>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor={name}>{label}</FieldLabel>
                    <Popover>
                        <PopoverTrigger>
                            <Button
                                id={name}
                                type="button"
                                variant="outline"
                                aria-invalid={!!fieldState.error}
                                className={cn(
                                    "justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "yyyy-MM-dd") : placeholder}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
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