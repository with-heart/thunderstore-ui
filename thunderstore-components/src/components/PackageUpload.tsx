import {
  Box,
  Button,
  Center,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Heading,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import JSZip from "jszip";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { apiFetch } from "../fetch";
import { CategoryPicker } from "./CategoryPicker";
import { CommunityPicker } from "./CommunityPicker";
import { FileUpload } from "./FileUpload";
import { Markdown } from "./Markdown";
import { StickyFooter } from "./StickyFooter";
import { TeamPicker } from "./TeamPicker";
import { ThunderstoreContext } from "./ThunderstoreProvider";

interface PackageUploadFormProps {
  readmeContent: string;
  modZip: File;
}

const PackageUploadForm: React.FC<PackageUploadFormProps> = ({
  readmeContent,
  modZip,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const { register, handleSubmit, formState } = useForm();
  const context = useContext(ThunderstoreContext);

  return (
    <>
      <Heading>Markdown Preview</Heading>
      <Box borderWidth="1px" borderRadius="lg" m={1} p={2}>
        <Markdown>{readmeContent}</Markdown>
      </Box>
      <StickyFooter>
        <Center>
          <Button ref={btnRef} onClick={onOpen}>
            Upload
          </Button>
        </Center>
      </StickyFooter>
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay>
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Upload package</DrawerHeader>
            <form
              onSubmit={handleSubmit(
                async (data) => {
                  data.categories = [data.categories];
                  data.communities = [data.communities];

                  const formData = new FormData();
                  formData.append("metadata", JSON.stringify(data));
                  formData.append("file", modZip);
                  await apiFetch(context, "/experimental/package/upload/", {
                    method: "POST",
                    body: formData,
                  });
                },
                (errors, e) => {
                  console.log(errors, e);
                }
              )}
            >
              <DrawerBody>
                <Stack>
                  <Box>
                    <Heading as="h2" size="md" mb={1}>
                      Team
                    </Heading>
                    <TeamPicker name="author_name" ref={register} />
                  </Box>
                  <Box>
                    <Heading as="h2" size="md" mb={1}>
                      Categories
                    </Heading>
                    <CategoryPicker name="categories" ref={register} />
                  </Box>
                  <Box>
                    <Heading as="h2" size="md" mb={1}>
                      Communities
                    </Heading>
                    <CommunityPicker name="communities" ref={register} />
                  </Box>
                  <Box>
                    <Checkbox name="has_nsfw_content" ref={register}>
                      Has NSFW content
                    </Checkbox>
                  </Box>
                </Stack>
              </DrawerBody>
              <DrawerFooter>
                <Button variant="outline" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={formState.isSubmitting}>
                  Upload
                </Button>
              </DrawerFooter>
            </form>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
    </>
  );
};

export const PackageUpload: React.FC<never> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [zip, setZip] = useState<JSZip | null>(null);
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    onUpload();
  }, [file]);

  useEffect(() => {
    onZip();
  }, [zip]);

  const reset = () => {
    setFile(null);
    setZip(null);
  };

  const onUpload = async () => {
    if (file === null) {
      return;
    }
    const zip = new JSZip();
    try {
      await zip.loadAsync(file);
    } catch {
      toast({
        title: "Invalid mod zip",
        status: "error",
        isClosable: true,
      });
      reset();
      return;
    }
    setZip(zip);
  };

  const onZip = async () => {
    if (zip === null) {
      return;
    }
    const errors: string[] = [];
    ["manifest.json", "README.md", "icon.png"].forEach((fileName) => {
      if (zip.files[fileName] === undefined) {
        errors.push(`Missing ${fileName}`);
      }
    });
    if (errors.length > 0) {
      errors.map((error) => {
        toast({
          title: "Invalid mod zip",
          description: error,
          status: "error",
          isClosable: true,
        });
      });
      reset();
      return;
    }
    const readmeContent = await zip.file("README.md")?.async("string");
    if (!readmeContent) {
      toast({
        title: "Invalid mod zip",
        description: "Invalid README.md",
        status: "error",
        isClosable: true,
      });
      reset();
      return;
    }
    setReadmeContent(readmeContent);
  };

  if (!file) {
    // First state, has not selected a file
    return (
      <FileUpload
        onUpload={(files) => {
          setFile(files[0]);
        }}
        accept="application/zip"
      />
    );
  } else if (!zip) {
    // Second state, has selected a file but it has not been decompressed
    return <Text>Decompressing...</Text>;
  } else if (readmeContent !== null) {
    // Third state, the file has been validated and decompressed
    return <PackageUploadForm readmeContent={readmeContent} modZip={file} />;
  } else {
    return <Text>Loading...</Text>;
  }
};
