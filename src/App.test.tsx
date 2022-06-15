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
} from "firebase/storage";
import { act } from "react-dom/test-utils";

test("renders learn react link", async () => {
  const { getByText } = await renderWithStorage(async (storage) => {
    const r = ref(storage, "foo.txt");
    const someBytes = Uint8Array.from(Buffer.from(new ArrayBuffer(500_000)));

    console.log("start");
    await uploadBytes(r, someBytes);
    console.log("end");

    return <div>Hello</div>;
  });

  const foo = getByText(/hello/i);
  expect(foo).toBeInTheDocument();
});

const TEST_ID = "async-storage-loaded";

async function renderWithStorage(childrenFn) {
  return render(<AsyncComponent r={childrenFn} />);
}

const AsyncComponent: React.FC<{
  r: (storage: FirebaseStorage) => Promise<React.ReactElement>;
}> = ({ r }) => {
  const [storageChildren, setStorageChildren] = useState<JSX.Element | null>(
    null
  );

  const hostAndPort = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  if (!hostAndPort) {
    throw new Error(
      "Provide storage emulator address by setting FIREBASE_STORAGE_EMULATOR_HOST"
    );
  }
  const [host, port] = hostAndPort.split(":");
  console.log({ host, port });

  const app = initializeApp({
    projectId: `foo-${Date.now}`,
  });
  const storage = getStorage(app, "gs://foo.appspot.com");
  connectStorageEmulator(storage, host, Number(port));

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
