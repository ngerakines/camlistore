package com.danga.camli;

import java.io.File;

import android.net.Uri;
import android.os.FileObserver;
import android.os.RemoteException;
import android.util.Log;

import com.danga.camli.IUploadService.Stub;

public class CamliFileObserver extends FileObserver {
    private static final String TAG = "CamliFileObserver";

    private final File mDirectory;
    private final Stub mServiceStub;

    public CamliFileObserver(IUploadService.Stub service, File directory) {
        super(directory.getAbsolutePath(), FileObserver.CLOSE_WRITE | FileObserver.MOVED_TO);
        // TODO: Docs say: "The monitored file or directory must exist at this
        // time, or else no events will be reported (even if it appears
        // later).".  This means that a user without, say, a "gpx/" directory
        // that then goes to "Export all Tracks.." won't start them uploading.
        mDirectory = directory;
        mServiceStub = service;
        Log.d(TAG, "Starting to watch: " + mDirectory.getAbsolutePath());
        startWatching();
    }

    @Override
    public void onEvent(int event, String path) {
        if (path == null) {
            // It's null for certain directory-level events.
            return;
        }

        // Note from docs:
        // "This method is invoked on a special FileObserver thread."

        // Order in which we get events for a new camera picture:
        // CREATE, OPEN, MODIFY, [OPEN, CLOSE_NOWRITE], CLOSE_WRITE
        File fullFile = new File(mDirectory, path);
        Log.d(TAG, "event " + event + " for " + fullFile.getAbsolutePath());
        try {
            mServiceStub.enqueueUpload(Uri.fromFile(fullFile));
        } catch (RemoteException e) {
        }
    }
}