class AnswersController < ApplicationController
  before_action :require_user
  before_action -> { require_role(:candidate) }

  # The recording itself is discarded: this demo stores only what proves it was captured.
  def create
    invitation = current_user.invitations.find(params[:interview_id])
    return head(:conflict) if invitation.status == "completed"

    recording = params.require(:recording)
    answer = invitation.answers.find_or_initialize_by(question_index: params[:question_index].to_i)
    answer.update!(duration_ms: params[:duration_ms].to_i, byte_size: recording.size)
    render json: { question_index: answer.question_index, byte_size: answer.byte_size, all_answered: invitation.all_answered? }
  end
end
