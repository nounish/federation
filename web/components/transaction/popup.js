import styles from "./popup.module.scss";
import * as Dialog from "@radix-ui/react-dialog";

export default ({ open, setOpen, children }) => {
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger />
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay}>
          <Dialog.Content className={styles.dialogContent}>{children}</Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
