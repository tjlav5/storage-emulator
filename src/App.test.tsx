import { render, screen } from "@testing-library/react";
import App from "./App";
import { useEffect, useState } from "React";
import { initializeApp } from "firebase/app";
import {
  connectStorageEmulator,
  FirebaseStorage,
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  uploadString,
} from "firebase/storage";
import { act } from "react-dom/test-utils";

test("without render helper", async () => {
  const storage = getEmulatedStorage();
  const r = ref(storage, "foo.txt");

  console.log({ storage, r });

  console.log("start");
  await uploadString(r, "fooooo");
  console.log("end");

  expect(true).toBe(true);
});

test("with render helper", async () => {
  const { getByText } = await renderWithStorage(async (storage) => {
    const r = ref(storage, "foo.txt");
    const someBytes = Uint8Array.from(Buffer.from(new ArrayBuffer(500_000)));

    console.log("start", { r, someBytes });
    try {
      await uploadBytesResumable(r, someBytes);
      // await uploadString(r, "foo");
    } catch (e) {
      console.log({ e });
    }
    console.log("end");

    return <div>Hello</div>;
  });

  const foo = getByText(/hello/i);
  expect(foo).toBeInTheDocument();
});

const TEST_ID = "async-storage-loaded";

function getEmulatedStorage() {
  const hostAndPort = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  if (!hostAndPort) {
    throw new Error(
      "Provide storage emulator address by setting FIREBASE_STORAGE_EMULATOR_HOST"
    );
  }
  const [host, port] = hostAndPort.split(":");
  console.log({ host, port });

  const app = initializeApp({
    projectId: `sample`,
  });
  const storage = getStorage(app, "gs://foo.appspot.com");
  connectStorageEmulator(storage, host, Number(port));

  return storage;
}

async function renderWithStorage(childrenFn) {
  const storage = getEmulatedStorage();
  return render(<AsyncComponent r={childrenFn} storage={storage} />);
}

const AsyncComponent: React.FC<{
  storage: FirebaseStorage;
  r: (storage: FirebaseStorage) => Promise<React.ReactElement>;
}> = ({ storage, r }) => {
  const [storageChildren, setStorageChildren] = useState<JSX.Element | null>(
    null
  );

  useEffect(() => {
    r(storage).then((c) => {
      act(() => {
        setStorageChildren(c);
      });
    });
  }, [r, storage, setStorageChildren]);

  return storageChildren ? (
    <div data-testid={TEST_ID}>{storageChildren}</div>
  ) : null;
};
