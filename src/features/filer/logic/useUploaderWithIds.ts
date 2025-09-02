import { ref, watch, type Ref } from 'vue';
import { storeToRefs } from 'pinia';
import env from 'InvestCommon/domain/config/env';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';

export interface UploaderWithIdsProps {
  modelValue?: number[] | null;
  isError?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string; // e.g., "application/pdf,image/*"
  dragDropText?: string;
  uploadButtonText?: string;
  supportedFilesText?: string;
  maxSizeText?: string;
  showFilePreview?: boolean;
  showSupportedFilesInfo?: boolean;
  showMaxSizeInfo?: boolean;
  customClass?: string;
  multiple?: boolean | null;
}

// Keep emit flexible to be compatible with Vue's generated emit type
export type UploaderWithIdsEmit = any;

export interface UseUploaderWithIdsReturn {
  filesUploadError: Ref<string>;
  isUploading: Ref<boolean>;
  uploadedFileIds: Ref<number[]>;
  uploadedFileNames: Ref<string[]>;
  uploadedFiles: Ref<File[]>;
  onFilesChange: (files: File[]) => Promise<void>;
  onFileRemove: (index: number) => void;
  onUploaderError: (message: string) => void;
  onClick: (index: number) => void;
}

export function useUploaderWithIds(
  props: Readonly<UploaderWithIdsProps>,
  emit: UploaderWithIdsEmit
): UseUploaderWithIdsReturn {
  const filesUploadError = ref('');
  const isUploading = ref(false);
  const uploadedFileIds = ref<number[]>(props.modelValue || []);
  const uploadedFileNames = ref<string[]>([]);
  const uploadedFiles = ref<File[]>([]);

  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { getUserState } = storeToRefs(useRepositoryProfilesStore);
  const filerRepository = useRepositoryFiler();
  const { postSignurlState } = storeToRefs(filerRepository);

  watch(
    () => props.modelValue,
    (newValue) => {
      uploadedFileIds.value = newValue || [];
    }
  );

  watch(isUploading, (newValue) => {
    emit('uploading', newValue);
  });

  const onUpload = async (file: File): Promise<number | null> => {
    await filerRepository.uploadHandler(
      file,
      String(getUserState.value?.data?.id),
      'user',
      getUserState.value?.data?.id
    );
    if (postSignurlState.value.data?.meta?.id) {
      return postSignurlState.value.data?.meta?.id;
    }
    return null;
  };

  const onFilesChange = async (files: File[]) => {
    if (files.length === 0) {
      uploadedFileIds.value = [];
      uploadedFileNames.value = [];
      uploadedFiles.value = [];
      emit('update:modelValue', null);
      emit('upload-success', []);
      return;
    }

    isUploading.value = true;
    filesUploadError.value = '';

    try {
      const newFileIds: number[] = [];
      const newFileNames: string[] = [];
      const newFiles: File[] = [];

      const filesToProcess = props.multiple === null ? [files[files.length - 1]] : files;

      for (const file of filesToProcess) {
        await onUpload(file);
        if (postSignurlState.value.data?.meta?.id) {
          newFileIds.push(postSignurlState.value.data?.meta?.id);
          newFileNames.push(file.name);
          newFiles.push(file);
        } else {
          throw new Error(`Failed to upload file: ${file.name}`);
        }
      }

      uploadedFileIds.value = newFileIds;
      uploadedFileNames.value = newFileNames;
      uploadedFiles.value = newFiles;

      emit('update:modelValue', uploadedFileIds.value);
      emit('upload-success', uploadedFileIds.value);
      filesUploadError.value = '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      filesUploadError.value = errorMessage;
      emit('upload-error', errorMessage);
    } finally {
      isUploading.value = false;
    }
  };

  const onFileRemove = (index: number) => {
    uploadedFileIds.value.splice(index, 1);
    uploadedFileNames.value.splice(index, 1);
    uploadedFiles.value.splice(index, 1);

    emit('update:modelValue', uploadedFileIds.value.length > 0 ? uploadedFileIds.value : null);
    emit('remove', index);
  };

  const onUploaderError = (message: string) => {
    filesUploadError.value = message;
    emit('upload-error', message);
  };

  const onClick = (index: number) => {
    if (uploadedFileIds.value[index] && uploadedFileIds.value[index] > 0) {
      const fileUrl = `${env.FILER_URL}/auth/files/${uploadedFileIds.value[index]}`;
      window.open(fileUrl, '_blank');
    }
  };

  return {
    filesUploadError,
    isUploading,
    uploadedFileIds,
    uploadedFileNames,
    uploadedFiles,
    onFilesChange,
    onFileRemove,
    onUploaderError,
    onClick,
  };
}


