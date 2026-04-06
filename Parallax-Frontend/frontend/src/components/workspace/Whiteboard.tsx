import { useEffect, useState } from 'react';
import { Tldraw, useEditor, Editor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { voiceWs } from '../../services/wsVoice';

function WhiteboardSync({ canEdit }: { canEdit: boolean }) {
    const editor = useEditor();

    useEffect(() => {
        // Subscribe to incoming edits
        const subscription = voiceWs.subscribeWhiteboard((payload) => {
            if (payload && payload.changes) {
                // Merge remote updates seamlessly without breaking local state
                editor.store.mergeRemoteChanges(() => {
                    if (payload.changes.added) {
                        for (const record of Object.values(payload.changes.added)) {
                            editor.store.put([record as any]);
                        }
                    }
                    if (payload.changes.updated) {
                        for (const [_old, newRecord] of Object.values(payload.changes.updated) as any) {
                            editor.store.put([newRecord]);
                        }
                    }
                    if (payload.changes.removed) {
                        for (const record of Object.values(payload.changes.removed) as any) {
                            editor.store.remove([record.id]);
                        }
                    }
                });
            }
        });

        // Publish local edits
        const cleanupListener = editor.store.listen(
            (update) => {
                if (!canEdit) return;
                if (update.source === 'user') {
                    voiceWs.publishWhiteboard({ changes: update.changes });
                }
            },
            { source: 'user', scope: 'document' }
        );

        return () => {
            if (subscription) subscription.unsubscribe();
            cleanupListener();
        };
    }, [editor, canEdit]);

    return null; // Logic-only component
}

export default function Whiteboard({ canEdit = true }: { canEdit?: boolean }) {
    return (
        <div style={{ width: '100%', height: '100%' }} className={canEdit ? '' : 'pointer-events-none'}>
            <Tldraw>
                <WhiteboardSync canEdit={canEdit} />
            </Tldraw>
        </div>
    );
}
