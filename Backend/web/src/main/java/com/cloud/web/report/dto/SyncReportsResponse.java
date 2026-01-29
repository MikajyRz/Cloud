package com.cloud.web.report.dto;

public class SyncReportsResponse {

    private int fetched;
    private int inserted;
    private int updated;
    private String collection;

    public SyncReportsResponse() {
    }

    public SyncReportsResponse(int fetched, int inserted, int updated, String collection) {
        this.fetched = fetched;
        this.inserted = inserted;
        this.updated = updated;
        this.collection = collection;
    }

    public int getFetched() {
        return fetched;
    }

    public void setFetched(int fetched) {
        this.fetched = fetched;
    }

    public int getInserted() {
        return inserted;
    }

    public void setInserted(int inserted) {
        this.inserted = inserted;
    }

    public int getUpdated() {
        return updated;
    }

    public void setUpdated(int updated) {
        this.updated = updated;
    }

    public String getCollection() {
        return collection;
    }

    public void setCollection(String collection) {
        this.collection = collection;
    }
}
