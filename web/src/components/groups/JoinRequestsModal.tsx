import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { formatDate } from "@utils/formatUtils";
import type { JoinGroupRequestPublic } from "@schema/groups";

interface JoinRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: JoinGroupRequestPublic[];
  isLoading: boolean;
  isError: boolean;
  isMutating: boolean;
  onAccept: (requestId: number) => void;
  onDecline: (requestId: number) => void;
}

export const JoinRequestsModal: React.FC<JoinRequestsModalProps> = ({
  isOpen,
  onClose,
  requests,
  isLoading,
  isError,
  isMutating,
  onAccept,
  onDecline,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl w-full"
      titleId="join-requests-modal-title"
      descriptionId="join-requests-modal-description"
    >
      <ModalHeader
        title="Join requests"
        description="Review pending requests to join this group."
        onClose={onClose}
        titleId="join-requests-modal-title"
        descriptionId="join-requests-modal-description"
      />
      <ModalContent>
        {isLoading ? (
          <div className="flex items-center gap-3 text-slate-600">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading requests...</p>
          </div>
        ) : isError ? (
          <Alert variant="error">Couldn't load join requests.</Alert>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 px-4 py-6 text-center">
            <p className="text-sm font-medium text-slate-700">
              No pending join requests.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              New requests will show up here when someone asks to join.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-amber-100 bg-amber-50/60 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {request.requester.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {request.requester.email}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Requested {formatDate(request.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onAccept(request.id)}
                      disabled={isMutating}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onDecline(request.id)}
                      disabled={isMutating}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};
