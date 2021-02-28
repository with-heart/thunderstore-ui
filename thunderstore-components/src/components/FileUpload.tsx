import { Box, Center, chakra, Text, useColorModeValue } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { DropEvent, FileRejection, useDropzone } from "react-dropzone";

interface FileUploadProps {
  onUpload: (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
    event: DropEvent
  ) => void;
  accept?: string | string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, accept }) => {
  const bg = useColorModeValue("white", "gray");
  const onDrop = useCallback(onUpload, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept,
  });

  return (
    <Box {...getRootProps()} background={bg}>
      <Center>
        <chakra.input {...getInputProps()} />
        {isDragActive ? (
          <Text>Drop the file here</Text>
        ) : (
          <Text>Drop the file here, or click to select files</Text>
        )}
      </Center>
    </Box>
  );
};
