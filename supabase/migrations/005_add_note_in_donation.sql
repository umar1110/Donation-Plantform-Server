
ALTER TABLE donations
ADD COLUMN note TEXT;

-- comment 
COMMENT ON COLUMN donations.note IS 'Internal note for staff about the donation that donations is zakat , sadqa etc ';

-- RLS
BEGIN;

