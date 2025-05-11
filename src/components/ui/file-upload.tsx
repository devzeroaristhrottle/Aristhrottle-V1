"use client";

import type { ButtonProps, RecipeProps } from "@chakra-ui/react";
import {
  Button,
  FileUpload as ChakraFileUpload,
  Icon,
  IconButton,
  Span,
  Text,
  useFileUploadContext,
  useRecipe,
} from "@chakra-ui/react";
import * as React from "react";
import { LuFile, LuX } from "react-icons/lu";
import { AiOutlineCloudUpload } from "react-icons/ai";

export interface FileUploadRootProps extends ChakraFileUpload.RootProps {
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const FileUploadRoot = React.forwardRef<
  HTMLInputElement,
  FileUploadRootProps
>(function FileUploadRoot(props, ref) {
  const { children, inputProps, ...rest } = props;
  return (
    <ChakraFileUpload.Root {...rest}>
      <ChakraFileUpload.HiddenInput ref={ref} {...inputProps} />
      {children}
    </ChakraFileUpload.Root>
  );
});

export interface FileUploadDropzoneProps
  extends ChakraFileUpload.DropzoneProps {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export const FileUploadDropzone = React.forwardRef<
  HTMLInputElement,
  FileUploadDropzoneProps
>(function FileUploadDropzone(props, ref) {
  const { children, label, description, ...rest } = props;
  return (
    <ChakraFileUpload.Dropzone ref={ref} {...rest}>
      <Icon className="text-black font-bold border-2 border-black rounded-md p-3">
        <AiOutlineCloudUpload className="w-12 h-12 md:w-20 md:h-20" />
      </Icon>
      <ChakraFileUpload.DropzoneContent>
        <p className="text-black text-lg md:text-3xl font-semibold">{label}</p>
        {description && (
          <Text className="font-medium text-sm md:text-lg text-gray-400">
            {description}
          </Text>
        )}
      </ChakraFileUpload.DropzoneContent>
      {children}
    </ChakraFileUpload.Dropzone>
  );
});

interface VisibilityProps {
  showSize?: boolean;
  clearable?: boolean;
}

interface FileUploadItemProps extends VisibilityProps {
  file: File;
}

const FileUploadItem = React.forwardRef<HTMLLIElement, FileUploadItemProps>(
  function FileUploadItem(props, ref) {
    const { file, showSize, clearable } = props;
    return (
      <ChakraFileUpload.Item
        file={file}
        ref={ref}
        className="border border-[#1681fa] bg-transparent"
      >
        <ChakraFileUpload.ItemPreview asChild>
          <Icon fontSize="lg" color="fg.muted">
            <LuFile />
          </Icon>
        </ChakraFileUpload.ItemPreview>

        {showSize ? (
          <ChakraFileUpload.ItemContent>
            <ChakraFileUpload.ItemName />
            <ChakraFileUpload.ItemSizeText />
          </ChakraFileUpload.ItemContent>
        ) : (
          <ChakraFileUpload.ItemName flex="1" />
        )}

        {clearable && (
          <ChakraFileUpload.ItemDeleteTrigger asChild>
            <IconButton variant="ghost" color="fg.muted" size="xs">
              <LuX />
            </IconButton>
          </ChakraFileUpload.ItemDeleteTrigger>
        )}
      </ChakraFileUpload.Item>
    );
  }
);

interface FileUploadListProps
  extends VisibilityProps,
    ChakraFileUpload.ItemGroupProps {
  files?: File[];
}

export const FileUploadList = React.forwardRef<
  HTMLUListElement,
  FileUploadListProps
>(function FileUploadList(props, ref) {
  const { showSize, clearable, files, ...rest } = props;

  const fileUpload = useFileUploadContext();
  const acceptedFiles = files ?? fileUpload.acceptedFiles;

  if (acceptedFiles.length === 0) return null;

  return (
    <ChakraFileUpload.ItemGroup ref={ref} {...rest}>
      {acceptedFiles.map((file) => (
        <FileUploadItem
          key={file.name}
          file={file}
          showSize={showSize}
          clearable={clearable}
        />
      ))}
    </ChakraFileUpload.ItemGroup>
  );
});

type Assign<T, U> = Omit<T, keyof U> & U;

interface FileInputProps extends Assign<ButtonProps, RecipeProps<"input">> {
  placeholder?: React.ReactNode;
}

export const FileInput = React.forwardRef<HTMLButtonElement, FileInputProps>(
  function FileInput(props, ref) {
    const inputRecipe = useRecipe({ key: "input" });
    const [recipeProps, restProps] = inputRecipe.splitVariantProps(props);
    const { placeholder = "Select file(s)", ...rest } = restProps;
    return (
      <ChakraFileUpload.Trigger asChild>
        <Button
          unstyled
          py="0"
          ref={ref}
          {...rest}
          css={[inputRecipe(recipeProps), props.css]}
        >
          <ChakraFileUpload.Context>
            {({ acceptedFiles }) => {
              if (acceptedFiles.length === 1) {
                return <span>{acceptedFiles[0].name}</span>;
              }
              if (acceptedFiles.length > 1) {
                return <span>{acceptedFiles.length} files</span>;
              }
              return <Span color="fg.subtle">{placeholder}</Span>;
            }}
          </ChakraFileUpload.Context>
        </Button>
      </ChakraFileUpload.Trigger>
    );
  }
);

export const FileUploadLabel = ChakraFileUpload.Label;
export const FileUploadClearTrigger = ChakraFileUpload.ClearTrigger;
export const FileUploadTrigger = ChakraFileUpload.Trigger;
