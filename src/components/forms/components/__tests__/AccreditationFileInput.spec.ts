import {
  render, screen, fireEvent,
} from '@testing-library/vue';
import {
  vi, it, beforeEach, afterEach, expect, describe,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import createFetchMock from 'vitest-fetch-mock';
import AccreditationFileInput from '../AccreditationFileInput.vue';

vi.mock('InvestCommon/store');
vi.mock('InvestCommon/store/useAccreditation', () => ({
  useAccreditationStore: vi.fn().mockReturnValue({
    uploadAccreditationDocumentErrorData: {
      value: undefined,
    },
  }),
}));

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

function renderComponent() {
  const { debug, container } = render(AccreditationFileInput);

  const inputFile: HTMLInputElement = screen.getByTestId('accreditation-input-file');

  return {
    inputFile,
    debug,
    container,
  };
}

async function updateInputFile(el: HTMLInputElement, files: File[]) {
  Object.defineProperty(el, 'files', {
    value: files,
  });

  await fireEvent.update(el);
}

describe('ViewAccreditation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('input should upload file', async () => {
    const {
      inputFile,
    } = renderComponent();
    const filesSample = [
      new File(['files1'], 'sample1.pdf', { type: 'application/pdf' }),
    ];

    await updateInputFile(inputFile, filesSample);

    const filesInput = inputFile.files as FileList;

    expect(filesInput.length).toBe(1);
    expect(filesInput[0].name).toBe('sample1.pdf');
  });

  it('input should upload no more than 5 files', async () => {
    const {
      inputFile,
    } = renderComponent();

    const filesSample = [
      new File(['files1'], 'sample1.pdf', { type: 'application/pdf' }),
      new File(['files2'], 'sample2.pdf', { type: 'application/pdf' }),
      new File(['files3'], 'sample3.pdf', { type: 'application/pdf' }),
      new File(['files4'], 'sample4.pdf', { type: 'application/pdf' }),
      new File(['files5'], 'sample5.pdf', { type: 'application/pdf' }),
      new File(['files6'], 'sample6.pdf', { type: 'application/pdf' }),
    ];

    await updateInputFile(inputFile, filesSample);

    const filesInput = inputFile.files as FileList;

    expect(filesInput.length).toBe(6);
    expect(screen.queryByText('You are only allowed to upload a maximum of 5 files at a time')).toBeTruthy();
  });

  it.skip('input should not upload files that already exist', async () => {
    const defaultFiles = [
      new File(['files1'], 'sample1.pdf', { type: 'application/pdf' }),
    ];
    const {
      inputFile,
    } = renderComponent();
    await updateInputFile(inputFile, defaultFiles);

    const filesSample = [
      new File(['files1'], 'sample1.pdf', { type: 'application/pdf' }),
      new File(['files2'], 'sample2.pdf', { type: 'application/pdf' }),
    ];

    await updateInputFile(inputFile, filesSample);
    expect(screen.queryByText('New upload contains files that already exist')).toBeTruthy();
  });

  it('should display one input text for one file uploaded', async () => {
    const defaultFiles = [
      new File(['files1'], 'sample1.pdf', { type: 'application/pdf' }),
    ];
    const {
      inputFile,
    } = renderComponent();
    await updateInputFile(inputFile, defaultFiles);

    expect(screen.getAllByTestId('file-description').length).toBe(1);
  });

  it('should display two input text for two files uploaded', async () => {
    const defaultFiles = [
      new File(['files1'], 'sample1.pdf', { type: 'application/pdf' }),
      new File(['files2'], 'sample2.pdf', { type: 'application/pdf' }),
    ];
    const {
      inputFile,
    } = renderComponent();
    await updateInputFile(inputFile, defaultFiles);

    expect(screen.getAllByTestId('file-description').length).toBe(2);
  });

  it('should display three input text for three files uploaded', async () => {
    const defaultFiles = [
      new File(['files1'], 'sample1.pdf', { type: 'application/pdf' }),
      new File(['files2'], 'sample2.pdf', { type: 'application/pdf' }),
      new File(['files3'], 'sample3.pdf', { type: 'application/pdf' }),
    ];
    const {
      inputFile,
    } = renderComponent();
    await updateInputFile(inputFile, defaultFiles);

    expect(screen.getAllByTestId('file-description').length).toBe(3);
  });

  it('should display four input text for four files uploaded', async () => {
    const defaultFiles = [
      new File(['files1'], 'sample1.pdf', { type: 'application/pdf' }),
      new File(['files2'], 'sample2.pdf', { type: 'application/pdf' }),
      new File(['files3'], 'sample3.pdf', { type: 'application/pdf' }),
      new File(['files4'], 'sample4.pdf', { type: 'application/pdf' }),
    ];
    const {
      inputFile,
    } = renderComponent();
    await updateInputFile(inputFile, defaultFiles);

    expect(screen.getAllByTestId('file-description').length).toBe(4);
  });

  it('should display five input text for five files uploaded', async () => {
    const defaultFiles = [
      new File(['files1'], 'sample1.pdf', { type: 'application/pdf' }),
      new File(['files2'], 'sample2.pdf', { type: 'application/pdf' }),
      new File(['files3'], 'sample3.pdf', { type: 'application/pdf' }),
      new File(['files4'], 'sample4.pdf', { type: 'application/pdf' }),
      new File(['files5'], 'sample5.pdf', { type: 'application/pdf' }),
    ];
    const {
      inputFile,
    } = renderComponent();
    await updateInputFile(inputFile, defaultFiles);

    expect(screen.getAllByTestId('file-description').length).toBe(5);
  });
});
