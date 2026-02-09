package com.cloud.web.sync.dto;

public class SyncResultDetailedDto {
    private int fetched;
    private int inserted;
    private int updated;
    private int pushed;
    private String collection;

    public SyncResultDetailedDto() {}

    public SyncResultDetailedDto(int fetched, int inserted, int updated, int pushed, String collection) {
        this.fetched = fetched;
        this.inserted = inserted;
        this.updated = updated;
        this.pushed = pushed;
        this.collection = collection;
    }

    // Getters and Setters
    public int getFetched() { return fetched; }
    public void setFetched(int fetched) { this.fetched = fetched; }
    public int getInserted() { return inserted; }
    public void setInserted(int inserted) { this.inserted = inserted; }
    public int getUpdated() { return updated; }
    public void setUpdated(int updated) { this.updated = updated; }
    public int getPushed() { return pushed; }
    public void setPushed(int pushed) { this.pushed = pushed; }
    public String getCollection() { return collection; }
    public void setCollection(String collection) { this.collection = collection; }
}
